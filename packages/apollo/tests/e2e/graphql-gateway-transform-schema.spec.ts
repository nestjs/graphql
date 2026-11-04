import { MapperKind, mapSchema } from '@graphql-tools/utils';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { GraphQLSchema } from 'graphql';
import request from 'supertest';
import { ApolloGatewayDriver } from '../../lib/drivers/index.js';
import {
  getSupergraphSdl,
  supergraphSdl,
} from '../graphql-federation/gateway/supergraph-sdl.js';
import { AppModule as PostsModule } from '../graphql-federation/posts-service/federation-posts.module.js';
import { AppModule as UsersModule } from '../graphql-federation/users-service/federation-users.module.js';

describe('GraphQL Gateway transformSchema', () => {
  let postsApp: INestApplication;
  let usersApp: INestApplication;
  let gatewayApp: INestApplication;

  afterEach(async () => {
    await postsApp?.close();
    await usersApp?.close();
    await gatewayApp?.close();
  });

  it('invokes the gateway-level transformSchema callback with the composed supergraph schema', async () => {
    const usersModule = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();
    usersApp = usersModule.createNestApplication();
    await usersApp.listen(0);
    const usersPort = usersApp.getHttpServer().address().port;

    const postsModule = await Test.createTestingModule({
      imports: [PostsModule],
    }).compile();
    postsApp = postsModule.createNestApplication();
    await postsApp.listen(0);
    const postsPort = postsApp.getHttpServer().address().port;

    let receivedSchema: GraphQLSchema | undefined;
    let invocationCount = 0;

    const gatewayModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot({
          driver: ApolloGatewayDriver,
          gateway: {
            includeStacktraceInErrorResponses: false,
            supergraphSdl: getSupergraphSdl(usersPort, postsPort),
          },
          transformSchema: (schema: GraphQLSchema) => {
            invocationCount += 1;
            receivedSchema = schema;
            return schema;
          },
        }),
      ],
    }).compile();

    gatewayApp = gatewayModule.createNestApplication();
    await gatewayApp.init();

    expect(invocationCount).toBe(1);
    expect(receivedSchema).toBeDefined();
    // The composed supergraph must expose the federated `Post` type.
    expect(receivedSchema!.getType('Post')).toBeDefined();
    expect(receivedSchema!.getType('User')).toBeDefined();
  }, 15000);

  it('exposes the transformed schema to Apollo Server during query execution', async () => {
    const usersModule = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();
    usersApp = usersModule.createNestApplication();
    await usersApp.listen(0);
    const usersPort = usersApp.getHttpServer().address().port;

    const postsModule = await Test.createTestingModule({
      imports: [PostsModule],
    }).compile();
    postsApp = postsModule.createNestApplication();
    await postsApp.listen(0);
    const postsPort = postsApp.getHttpServer().address().port;

    const gatewayModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot({
          driver: ApolloGatewayDriver,
          gateway: {
            includeStacktraceInErrorResponses: false,
            supergraphSdl: getSupergraphSdl(usersPort, postsPort),
          },
          // Identity transform: confirms the wrapper does not break the
          // standard query path while still routing the schema through
          // the user-supplied callback.
          transformSchema: (schema: GraphQLSchema) => schema,
        }),
      ],
    }).compile();

    gatewayApp = gatewayModule.createNestApplication();
    await gatewayApp.init();

    return request(gatewayApp.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          getPosts {
            id
            title
          }
        }`,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.getPosts).toBeDefined();
      });
  }, 15000);

  it('does not execute operations the transformed schema no longer exposes', async () => {
    const usersModule = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();
    usersApp = usersModule.createNestApplication();
    await usersApp.listen(0);
    const usersPort = usersApp.getHttpServer().address().port;

    const postsModule = await Test.createTestingModule({
      imports: [PostsModule],
    }).compile();
    postsApp = postsModule.createNestApplication();
    await postsApp.listen(0);
    const postsPort = postsApp.getHttpServer().address().port;

    const gatewayModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot({
          driver: ApolloGatewayDriver,
          gateway: {
            includeStacktraceInErrorResponses: false,
            supergraphSdl: getSupergraphSdl(usersPort, postsPort),
          },
          // Drop the `Mutation` type and one enum value: neither is
          // caught by document validation when the client moves the
          // operation or the value out of the document.
          transformSchema: (schema: GraphQLSchema) =>
            mapSchema(schema, {
              [MapperKind.MUTATION]: () => null,
              [MapperKind.ENUM_VALUE]: (valueConfig, typeName, _, value) =>
                typeName === 'PostType' && value === 'IMAGE'
                  ? null
                  : valueConfig,
            }),
        }),
      ],
    }).compile();

    gatewayApp = gatewayModule.createNestApplication();
    await gatewayApp.init();

    await request(gatewayApp.getHttpServer())
      .post('/graphql')
      .send({
        query: 'mutation { publishPost(id: "1", publishDate: 500) { id } }',
      })
      .expect((res) => {
        expect(res.body.data?.publishPost).toBeUndefined();
        expect(res.body.errors?.[0]?.message).toBe(
          'Schema is not configured to execute mutation operation.',
        );
      });

    const getPostsByType = (type: string) =>
      request(gatewayApp.getHttpServer()).post('/graphql').send({
        query: 'query ($type: PostType) { getPosts(type: $type) { id } }',
        variables: { type },
      });

    await getPostsByType('IMAGE').expect((res) => {
      expect(res.body.data).toBeUndefined();
      expect(res.body.errors?.[0]?.message).toContain(
        'Value "IMAGE" does not exist in "PostType" enum.',
      );
    });
    await getPostsByType('TEXT')
      .expect(200)
      .expect((res) => {
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.getPosts).toBeDefined();
      });
  }, 15000);

  it('applies transformSchema to supergraph updates emitted after startup', async () => {
    let update: (supergraphSdl: string) => void;
    let invocationCount = 0;

    const gatewayModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot({
          driver: ApolloGatewayDriver,
          gateway: {
            supergraphSdl: async (options) => {
              update = options.update;
              return { supergraphSdl };
            },
          },
          transformSchema: (schema: GraphQLSchema) => {
            invocationCount += 1;
            return mapSchema(schema, {
              [MapperKind.ROOT_FIELD]: (fieldConfig, fieldName) =>
                fieldName === 'getUser' ? null : fieldConfig,
            });
          },
        }),
      ],
    }).compile();

    gatewayApp = gatewayModule.createNestApplication();
    await gatewayApp.init();

    const queryGetUser = () =>
      request(gatewayApp.getHttpServer())
        .post('/graphql')
        .send({ query: '{ getUser(id: "1") { id } }' })
        .expect((res) => {
          expect(res.body.errors?.[0]?.message).toBe(
            'Cannot query field "getUser" on type "Query".',
          );
        });

    await queryGetUser();

    update!(`${supergraphSdl}\n`);
    await vi.waitFor(() => expect(invocationCount).toBe(2));
    await queryGetUser();
  }, 15000);
});
