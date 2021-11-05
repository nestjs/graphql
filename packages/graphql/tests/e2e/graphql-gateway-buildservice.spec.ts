import { RemoteGraphQLDataSource } from '@apollo/gateway';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { GATEWAY_BUILD_SERVICE } from '../../lib';
import { AppModule as GatewayModule } from '../graphql-federation/gateway/gateway-buildservice.module';
import { AppModule as PostsModule } from '../graphql-federation/posts-service/federation-posts.module';
import { AppModule as UsersModule } from '../graphql-federation/users-service/federation-users.module';

describe('GraphQL Gateway buildservice', () => {
  let postsApp: INestApplication;
  let usersApp: INestApplication;
  let gatewayApp: INestApplication;
  let buildServiceHook: Function;

  beforeEach(async () => {
    buildServiceHook = jest.fn();
    const usersModule = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    usersApp = usersModule.createNestApplication();
    await usersApp.listenAsync(3001);

    const postsModule = await Test.createTestingModule({
      imports: [PostsModule],
    }).compile();

    postsApp = postsModule.createNestApplication();
    await postsApp.listenAsync(3002);

    const gatewayModule = await Test.createTestingModule({
      imports: [GatewayModule],
    })
      .overrideProvider(GATEWAY_BUILD_SERVICE)
      .useValue(({ url }) => {
        return new RemoteGraphQLDataSource({
          url,
          willSendRequest: buildServiceHook as any,
        });
      })
      .compile();

    gatewayApp = gatewayModule.createNestApplication();
    await gatewayApp.init();
  });

  it(`should run query through build service`, async () => {
    await request(gatewayApp.getHttpServer())
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
    expect(buildServiceHook).toHaveBeenCalled();
  });

  afterEach(async () => {
    await postsApp.close();
    await usersApp.close();
    await gatewayApp.close();
  });
});
