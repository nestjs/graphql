import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule as GatewayModule } from '../graphql-federation/gateway/gateway.module';
import { AppModule as PostsModule } from '../graphql-federation/posts-service/federation-posts.module';
import { AppModule as UsersModule } from '../graphql-federation/users-service/federation-users.module';

describe('GraphQL Gateway', () => {
  let postsApp: INestApplication;
  let usersApp: INestApplication;
  let gatewayApp: INestApplication;

  beforeEach(async () => {
    const usersModule = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    usersApp = usersModule.createNestApplication();
    await usersApp.listen(3001);

    const postsModule = await Test.createTestingModule({
      imports: [PostsModule],
    }).compile();

    postsApp = postsModule.createNestApplication();
    await postsApp.listen(3002);

    const gatewayModule = await Test.createTestingModule({
      imports: [GatewayModule],
    }).compile();

    gatewayApp = gatewayModule.createNestApplication();
    await gatewayApp.init();
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
  }, 15000);

  it(`should return complete options`, () => {
    const graphql = gatewayApp.get(GraphQLModule);

    expect(graphql.completeOptions).toHaveProperty('schema', null);
  });

  afterEach(async () => {
    await postsApp.close();
    await usersApp.close();
    await gatewayApp.close();
  });
});
