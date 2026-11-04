import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { type Mock, vi } from 'vitest';

import { GraphQLFederationFactory } from '../lib/federation/graphql-federation.factory.js';
import { TypeDefsDecoratorFactory } from '../lib/federation/type-defs-decorator.factory.js';
import { GraphQLSchemaBuilder } from '../lib/graphql-schema.builder.js';
import { ResolversExplorerService } from '../lib/services/resolvers-explorer.service.js';
import { ScalarsExplorerService } from '../lib/services/scalars-explorer.service.js';
import { GraphQLObjectType, GraphQLScalarType, GraphQLSchema } from 'graphql';

describe('GraphQLFederationFactory', () => {
  let graphqlFederationFactory: GraphQLFederationFactory;
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
          provide: GraphQLSchemaBuilder,
          useValue: vi.fn(),
        },
        TypeDefsDecoratorFactory,
        GraphQLFederationFactory,
      ],
    }).compile();

    graphqlFederationFactory = module.get(GraphQLFederationFactory);
  });

  describe('generateSchema', () => {
    it('should support transforming the resolvers', async () => {
      const resolvers = { Query: { echo: vi.fn() } };
      const transformedEcho = vi.fn();

      resolverExplorer.explore.mockReturnValueOnce(resolvers);
      scalarExplorer.explore.mockReturnValueOnce([]);

      const transformResolvers = vi.fn(() => [
        { Query: { echo: transformedEcho } },
      ]);

      const schema = await graphqlFederationFactory.generateSchema({
        transformResolvers,
        typeDefs: `
          type Query {
            echo(text: String!): String
          }
        `,
      });

      expect(transformResolvers).toHaveBeenCalledWith([resolvers]);
      expect(schema).toBeInstanceOf(GraphQLSchema);

      const queryType = schema.getQueryType() as GraphQLObjectType;
      queryType.getFields().echo.resolve(null, {}, {}, null);
      expect(transformedEcho).toHaveBeenCalled();
      expect(resolvers.Query.echo).not.toHaveBeenCalled();
    });

    it('should support undefined transformResolvers option', async () => {
      const resolvers = { Query: { echo: vi.fn() } };

      resolverExplorer.explore.mockReturnValueOnce(resolvers);
      scalarExplorer.explore.mockReturnValueOnce([]);

      const schema = await graphqlFederationFactory.generateSchema({
        typeDefs: `
          type Query {
            echo(text: String!): String
          }
        `,
      });

      expect(resolverExplorer.explore).toHaveBeenCalled();
      expect(scalarExplorer.explore).toHaveBeenCalled();
      expect(schema).toBeInstanceOf(GraphQLSchema);

      const queryType = schema.getQueryType() as GraphQLObjectType;
      queryType.getFields().echo.resolve(null, {}, {}, null);
      expect(resolvers.Query.echo).toHaveBeenCalled();
    });

    it('should merge the "resolvers" option with the discovered resolvers field by field', async () => {
      const email = vi.fn();
      const displayName = vi.fn();

      resolverExplorer.explore.mockReturnValueOnce({
        Query: { user: vi.fn() },
        User: { email },
      });
      scalarExplorer.explore.mockReturnValueOnce([]);

      const schema = await graphqlFederationFactory.generateSchema({
        resolvers: { User: { displayName } },
        typeDefs: `
          type User {
            email: String
            displayName: String
          }
          type Query {
            user: User
          }
        `,
      });

      const userType = schema.getType('User') as GraphQLObjectType;
      userType.getFields().email.resolve(null, {}, {}, null);
      userType.getFields().displayName.resolve(null, {}, {}, null);
      expect(email).toHaveBeenCalled();
      expect(displayName).toHaveBeenCalled();
    });

    it('should attach reference resolvers and custom scalars', async () => {
      const resolveReference = vi.fn();
      const Percent = new GraphQLScalarType({
        name: 'Percent',
        serialize: (value: number) => value * 100,
        parseValue: (value: number) => value / 100,
      });

      resolverExplorer.explore.mockReturnValueOnce({
        User: { __resolveReference: resolveReference },
      });
      scalarExplorer.explore.mockReturnValueOnce([{ Percent }]);

      const schema = await graphqlFederationFactory.generateSchema({
        typeDefs: `
          scalar Percent
          type User @key(fields: "id") {
            id: ID!
          }
          type Query {
            report(maxDiscount: Percent = 20): String
          }
        `,
      });

      const userType = schema.getType('User') as GraphQLObjectType;
      expect(
        (userType.extensions as any).apollo.subgraph.resolveReference,
      ).toBe(resolveReference);
      expect((schema.getType('Percent') as GraphQLScalarType).parseValue).toBe(
        Percent.parseValue,
      );
    });

    it('should parse default values with the custom scalars only once', async () => {
      const Percent = new GraphQLScalarType({
        name: 'Percent',
        serialize: (value: number) => value * 100,
        parseValue: (value: number) => value / 100,
      });

      resolverExplorer.explore.mockReturnValueOnce({});
      scalarExplorer.explore.mockReturnValueOnce([{ Percent }]);

      const schema = await graphqlFederationFactory.generateSchema({
        typeDefs: `
          scalar Percent
          type Query {
            report(maxDiscount: Percent = 20): String
          }
        `,
      });

      const queryType = schema.getQueryType() as GraphQLObjectType;
      const [maxDiscount] = queryType.getFields().report.args;
      expect(maxDiscount.defaultValue).toBe(0.2);
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

          const schema = await graphqlFederationFactory.generateSchema({
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

      it('should keep the own resolver of a type', async () => {
        resolverExplorer.explore.mockReturnValueOnce({
          PrivateNode: { owner: () => 'PrivateNode' },
          Invoice: { owner: () => 'Invoice' },
        });
        scalarExplorer.explore.mockReturnValueOnce([]);

        const schema = await graphqlFederationFactory.generateSchema({
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
        await graphqlFederationFactory.generateSchema({
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
