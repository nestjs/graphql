import {
  GraphQLModule,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
} from '@nestjs/graphql';
import { GRAPHQL_SDL_FILE_HEADER } from '@nestjs/graphql/graphql.constants';
import { Test } from '@nestjs/testing';
import {
  DirectiveLocation,
  getIntrospectionQuery,
  graphql,
  GraphQLBoolean,
  GraphQLDirective,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLSchema,
  IntrospectionSchema,
  printSchema,
} from 'graphql';
import { PostResolver } from '../code-first-federation/post/post.resolver';
import { IRecipeResolver } from '../code-first-federation/recipe/irecipe.resolver';
import { UserResolver } from '../code-first-federation/user/user.resolver';
import { printedSchemaSnapshot } from '../utils/printed-schema-with-cache-control.snapshot';
import { INestApplication } from '@nestjs/common';
import { ApolloServerBase } from 'apollo-server-core';
import { ApolloFederationDriver } from '../../lib';
import { gql } from 'graphql-tag';
import { CachingApplicationModule } from '../code-first-federation/caching.module';
import { PostService } from '../code-first-federation/post/post.service';
import { Post } from '../code-first-federation/post/post.entity';

describe('Code-first - Federation with caching', () => {
  describe('generated schema', () => {
    let schema: GraphQLSchema;
    let introspectionSchema: IntrospectionSchema;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [GraphQLSchemaBuilderModule],
      }).compile();

      const schemaFactory = moduleRef.get(GraphQLSchemaFactory);
      schema = await schemaFactory.create(
        [PostResolver, IRecipeResolver, UserResolver],
        {
          directives: [
            new GraphQLDirective({
              name: 'cacheControl',
              locations: [
                DirectiveLocation.FIELD_DEFINITION,
                DirectiveLocation.OBJECT,
                DirectiveLocation.INTERFACE,
              ],
              args: {
                maxAge: { type: GraphQLInt },
                scope: {
                  type: new GraphQLEnumType({
                    name: 'CacheControlScope',
                    values: {
                      PUBLIC: {},
                      PRIVATE: {},
                    },
                  }),
                },
                inheritMaxAge: { type: GraphQLBoolean },
              },
            }),
          ],
        },
      );

      introspectionSchema = await (
        await graphql(schema, getIntrospectionQuery())
      ).data.__schema;
    });

    it('should be valid', async () => {
      expect(schema).toBeInstanceOf(GraphQLSchema);
    });

    it('should match schema snapshot', () => {
      expect(GRAPHQL_SDL_FILE_HEADER + printSchema(schema)).toEqual(
        printedSchemaSnapshot,
      );
    });
  });

  describe('enabled cache', () => {
    let app: INestApplication;
    let apolloClient: ApolloServerBase;
    let postService: PostService;

    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [CachingApplicationModule],
        providers: [
          {
            provide: PostService,
            useValue: {
              findOne: () => new Post({ id: 1, title: 'HELLO WORLD' }),
            },
          },
        ],
      }).compile();

      app = module.createNestApplication();
      await app.init();
      const graphqlModule =
        app.get<GraphQLModule<ApolloFederationDriver>>(GraphQLModule);
      apolloClient = graphqlModule.graphQlAdapter?.instance;
      postService = module.get(PostService);
    });

    it('findOne should called once', async () => {
      const spy = jest.spyOn(postService, 'findOne');
      const request = {
        query: gql`
          {
            findPost(id: 1) {
              id
              title
            }
          }
        `,
      };

      await apolloClient.executeOperation(request);
      await apolloClient.executeOperation(request);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
