import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { GraphQLSchema } from 'graphql';
import request from 'supertest';
import { ApolloGatewayDriver } from '../../lib/drivers';
import { getSupergraphSdl } from '../graphql-federation/gateway/supergraph-sdl';
import { AppModule as PostsModule } from '../graphql-federation/posts-service/federation-posts.module';
import { AppModule as UsersModule } from '../graphql-federation/users-service/federation-users.module';

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
});
