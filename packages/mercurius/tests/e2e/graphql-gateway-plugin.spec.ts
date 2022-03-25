import { INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { FastifyInstance } from 'fastify';
import * as request from 'supertest';
import { AppModule as GatewayModule } from '../plugins/graphql-federation-plugin-no-options/gateway/gateway.module';
import { AppModule as PostsModule } from '../plugins/graphql-federation-plugin-no-options/posts-service/federation-posts.module';
import { AppModule as UsersModule } from '../plugins/graphql-federation-plugin-no-options/users-service/federation-users.module';
import { BASE_PLUGIN_URL } from '../plugins/mocks/utils/constants';

describe('GraphQL Gateway', () => {
  let postsApp: INestApplication;
  let usersApp: INestApplication;
  let gatewayApp: INestApplication;

  beforeEach(async () => {
    const usersModule = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    usersApp = usersModule.createNestApplication(new FastifyAdapter());
    await usersApp.listen(3011);

    const postsModule = await Test.createTestingModule({
      imports: [PostsModule],
    }).compile();

    postsApp = postsModule.createNestApplication(new FastifyAdapter());
    await postsApp.listen(3012);

    const gatewayModule = await Test.createTestingModule({
      imports: [GatewayModule],
    }).compile();

    gatewayApp = gatewayModule.createNestApplication(new FastifyAdapter());
    await gatewayApp.init();

    await gatewayApp.getHttpAdapter().getInstance().ready();
  });

  it(`should run lookup across boundaries`, () => {
    return request(gatewayApp.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          getPosts {
            id,
            title,
            body,
            user {
              id,
              name,
            }
          }
        }`,
      })
      .expect(200, {
        data: {
          getPosts: [
            {
              id: '1',
              title: 'HELLO WORLD',
              body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
              user: {
                id: '5',
                name: 'GraphQL',
              },
            },
          ],
        },
      });
  });

  it(`should run reverse lookup across boundaries`, () => {
    return request(gatewayApp.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          getUser(id: "5") {
            id,
            name,
            posts {
              id,
              title,
              body,
            }
          }
        }`,
      })
      .expect(200, {
        data: {
          getUser: {
            id: '5',
            name: 'GraphQL',
            posts: [
              {
                id: '1',
                title: 'HELLO WORLD',
                body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
              },
            ],
          },
        },
      });
  });

  it('should get the plugin', async () => {
    const fastifyInstance: FastifyInstance = gatewayApp
      .getHttpAdapter()
      .getInstance();
    await fastifyInstance.ready();

    const response = await fastifyInstance.inject({
      method: 'GET',
      url: BASE_PLUGIN_URL,
    });
    const data = JSON.parse(response.body);
    expect(fastifyInstance.printPlugins().includes('mockPlugin')).toBe(true);
    expect(response.statusCode).toBe(200);
    expect(data.from).toBe(BASE_PLUGIN_URL);
  });

  afterEach(async () => {
    await postsApp.close();
    await usersApp.close();
    await gatewayApp.close();
  });
});
