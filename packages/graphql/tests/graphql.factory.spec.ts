import { Test } from '@nestjs/testing';

import { GraphQLAstExplorer, GraphQLFactory } from '../lib';
import { GraphQLSchemaBuilder } from '../lib/graphql-schema.builder';
import { ResolversExplorerService } from '../lib/services/resolvers-explorer.service';
import { ScalarsExplorerService } from '../lib/services/scalars-explorer.service';
import gql from 'graphql-tag';
import { GraphQLSchema } from 'graphql';

describe('GraphQLFactory', () => {
  let graphqlFactory: GraphQLFactory;
  let resolverExplorer: { explore: vi.Mock };
  let scalarExplorer: { explore: vi.Mock };

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
  });
});
