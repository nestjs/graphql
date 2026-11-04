import { mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Mock, vi } from 'vitest';

import { GraphQLAstExplorer, GraphQLFactory } from '../lib/index.js';
import { GraphQLSchemaBuilder } from '../lib/graphql-schema.builder.js';
import { ResolversExplorerService } from '../lib/services/resolvers-explorer.service.js';
import { ScalarsExplorerService } from '../lib/services/scalars-explorer.service.js';
import {
  graphql,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  Kind,
} from 'graphql';

describe('GraphQLFactory', () => {
  let graphqlFactory: GraphQLFactory;
  let resolverExplorer: { explore: Mock };
  let scalarExplorer: { explore: Mock };

  beforeEach(async () => {
    resolverExplorer = { explore: vi.fn() };
    scalarExplorer = { explore: vi.fn() };
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: ResolversExplorerService,
          useValue: resolverExplorer,
        },
        {
          provide: ScalarsExplorerService,
          useValue: scalarExplorer,
        },
        {
          provide: GraphQLAstExplorer,
          useValue: vi.fn(),
        },
        {
          provide: GraphQLSchemaBuilder,
          useValue: vi.fn(),
        },
        GraphQLFactory,
      ],
    }).compile();

    graphqlFactory = module.get(GraphQLFactory);
  });

  describe('generateSchema', () => {
    it('should support transforming the resolvers', async () => {
      const resolvers = [{ Query: { echo: vi.fn() } }];

      resolverExplorer.explore.mockReturnValueOnce(resolvers);
      scalarExplorer.explore.mockReturnValueOnce([]);

      const transformResolvers = vi.fn((r) => r);

      const schema = await graphqlFactory.generateSchema({
        transformResolvers,
        typeDefs: `
          type Query {
            echo(text: String!): String
          }
        `,
      });

      expect(transformResolvers).toHaveBeenCalledWith(resolvers);
      expect(resolverExplorer.explore).toHaveBeenCalled();
      expect(scalarExplorer.explore).toHaveBeenCalled();
      expect(schema).toBeInstanceOf(GraphQLSchema);
    });

    it('should support undefined transformResolvers option', async () => {
      const resolvers = [{ Query: { echo: vi.fn() } }];

      resolverExplorer.explore.mockReturnValueOnce(resolvers);
      scalarExplorer.explore.mockReturnValueOnce([]);

      const schema = await graphqlFactory.generateSchema({
        typeDefs: `
          type Query {
            echo(text: String!): String
          }
        `,
      });

      expect(resolverExplorer.explore).toHaveBeenCalled();
      expect(scalarExplorer.explore).toHaveBeenCalled();
      expect(schema).toBeInstanceOf(GraphQLSchema);
    });

    it('should merge the "resolvers" option field by field', async () => {
      resolverExplorer.explore.mockReturnValueOnce({
        Query: { user: () => ({ name: 'alice' }) },
        User: { email: () => 'guarded' },
      });
      scalarExplorer.explore.mockReturnValueOnce([]);

      const schema = await graphqlFactory.generateSchema({
        transformResolvers: (resolvers) => mergeResolvers([resolvers].flat()),
        resolvers: { User: { displayName: () => 'ALICE' } },
        typeDefs: `
          type User { name: String email: String displayName: String }
          type Query { user: User }
        `,
      });
      const { data } = await graphql({
        schema,
        source: '{ user { email displayName } }',
      });

      expect(data).toEqual({
        user: { email: 'guarded', displayName: 'ALICE' },
      });
    });

    describe('when the "schema" option shares types with "typeDefs"', () => {
      const amount = new GraphQLScalarType({
        name: 'Amount',
        serialize: (value) => `EUR ${value}`,
        parseValue: (value) => {
          if (!Number.isInteger(value) || (value as number) <= 0) {
            throw new TypeError('Amount must be a positive integer');
          }
          return value;
        },
        parseLiteral: (ast) => {
          const value = ast.kind === Kind.INT ? Number(ast.value) : NaN;
          if (!Number.isInteger(value) || value <= 0) {
            throw new TypeError('Amount must be a positive integer');
          }
          return value;
        },
      });
      const paymentsSchema = () =>
        makeExecutableSchema({
          typeDefs: `
            scalar Amount
            enum Color { RED }
            type Query { dailyLimit: Amount color(color: Color!): String }
          `,
          resolvers: {
            Amount: amount,
            Color: { RED: '#f00' },
            Query: {
              dailyLimit: () => 100000,
              color: (_: unknown, args: { color: string }) => args.color,
            },
          },
        });
      const typeDefs = `
        scalar Amount
        enum Color { RED }
        type Query { fee(amount: Amount!): String paint(color: Color!): String }
      `;

      beforeEach(() => {
        resolverExplorer.explore.mockReturnValueOnce({
          Query: {
            fee: (_: unknown, args: { amount: unknown }) =>
              `fee for ${JSON.stringify(args.amount)}`,
            paint: (_: unknown, args: { color: string }) => args.color,
          },
        });
      });

      it('should keep the scalars and enums of the "schema" option', async () => {
        scalarExplorer.explore.mockReturnValueOnce([]);
        const schema = await graphqlFactory.generateSchema({
          typeDefs,
          schema: paymentsSchema(),
        });

        const literal = await graphql({
          schema,
          source: '{ fee(amount: -500) }',
        });
        expect(literal.errors?.[0].message).toContain(
          'Amount must be a positive integer',
        );
        const variable = await graphql({
          schema,
          source: 'query ($amount: Amount!) { fee(amount: $amount) }',
          variableValues: { amount: { any: ['json'] } },
        });
        expect(variable.errors?.[0].message).toContain(
          'Amount must be a positive integer',
        );
        const output = await graphql({
          schema,
          source: '{ dailyLimit paint(color: RED) color(color: RED) }',
        });
        expect(output).toEqual({
          data: { dailyLimit: 'EUR 100000', paint: '#f00', color: '#f00' },
        });
      });

      it('should let a scalar registered on the Nest side override them', async () => {
        scalarExplorer.explore.mockReturnValueOnce([
          {
            Amount: new GraphQLScalarType({
              name: 'Amount',
              serialize: (value) => `USD ${value}`,
            }),
          },
        ]);
        const schema = await graphqlFactory.generateSchema({
          typeDefs,
          schema: paymentsSchema(),
        });

        const { data } = await graphql({ schema, source: '{ dailyLimit }' });
        expect(data).toEqual({ dailyLimit: 'USD 100000' });
      });
    });

    describe('with "inheritResolversFromInterfaces"', () => {
      it.each(['Node & PrivateNode', 'PrivateNode & Node'])(
        'should inherit the resolver of the most specific interface (implements %s)',
        async (interfaces) => {
          resolverExplorer.explore.mockReturnValueOnce({
            Node: { owner: () => 'Node' },
            PrivateNode: { owner: () => 'PrivateNode' },
          });
          scalarExplorer.explore.mockReturnValueOnce([]);

          const schema = await graphqlFactory.generateSchema({
            inheritResolversFromInterfaces: true,
            typeDefs: `
              interface Node { owner: String }
              interface PrivateNode implements Node { owner: String }
              type Invoice implements ${interfaces} { owner: String }
              type Query { invoice: Invoice }
            `,
          });
          const invoice = schema.getType('Invoice') as GraphQLObjectType;

          expect(invoice.getFields().owner.resolve(null, {}, null, null)).toBe(
            'PrivateNode',
          );
        },
      );

      it('should keep the listed order for unrelated interfaces', async () => {
        resolverExplorer.explore.mockReturnValueOnce({
          Tagged: { owner: () => 'Tagged' },
          Audited: { owner: () => 'Audited' },
          Restricted: { owner: () => 'Restricted' },
        });
        scalarExplorer.explore.mockReturnValueOnce([]);

        const schema = await graphqlFactory.generateSchema({
          inheritResolversFromInterfaces: true,
          typeDefs: `
            interface Tagged { owner: String }
            interface Audited implements Tagged { owner: String }
            interface Restricted { owner: String }
            type Invoice implements Audited & Tagged & Restricted { owner: String }
            type Query { invoice: Invoice }
          `,
        });
        const invoice = schema.getType('Invoice') as GraphQLObjectType;

        expect(invoice.getFields().owner.resolve(null, {}, null, null)).toBe(
          'Restricted',
        );
      });

      it('should keep the own resolver of a type', async () => {
        resolverExplorer.explore.mockReturnValueOnce({
          PrivateNode: { owner: () => 'PrivateNode' },
          Invoice: { owner: () => 'Invoice' },
        });
        scalarExplorer.explore.mockReturnValueOnce([]);

        const schema = await graphqlFactory.generateSchema({
          inheritResolversFromInterfaces: true,
          typeDefs: `
            interface PrivateNode { owner: String }
            type Invoice implements PrivateNode { owner: String }
            type Query { invoice: Invoice }
          `,
        });
        const invoice = schema.getType('Invoice') as GraphQLObjectType;

        expect(invoice.getFields().owner.resolve(null, {}, null, null)).toBe(
          'Invoice',
        );
      });
    });

    it('should warn that the "directiveResolvers" option is ignored', async () => {
      const warn = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      resolverExplorer.explore.mockReturnValueOnce({});
      scalarExplorer.explore.mockReturnValueOnce([]);

      try {
        await graphqlFactory.generateSchema({
          directiveResolvers: { auth: (next: () => unknown) => next() },
          typeDefs: 'type Query { payroll: String }',
        });
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining('"directiveResolvers" option is ignored'),
        );
      } finally {
        warn.mockRestore();
      }
    });
  });
});
