import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule as GatewayModule } from '../code-first-graphql-federation2/gateway/gateway.module';
import { AppModule as PostsModule } from '../code-first-graphql-federation2/posts-service/federation-posts.module';
import { AppModule as UsersModule } from '../code-first-graphql-federation2/users-service/federation-users.module';

describe('GraphQL Gateway with Federation 2', () => {
  let postsApp: INestApplication;
  let usersApp: INestApplication;
  let gatewayApp: INestApplication;

  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await postsApp.close();
    await usersApp.close();
    await gatewayApp.close();
  });
});
