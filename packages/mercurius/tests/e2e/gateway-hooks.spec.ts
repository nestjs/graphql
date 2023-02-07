import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule as PostsModule } from '../graphql-federation/posts-service/federation-posts.module';
import { AppModule as UsersModule } from '../graphql-federation/users-service/federation-users.module';
import { ApplicationModule } from '../hooks/gateway/hooks.module';
import { MockLogger } from '../hooks/mocks/logger.mock';

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('GraphQL Gateway Hooks', () => {
  let postsApp: INestApplication;
  let usersApp: INestApplication;
  let gatewayApp: INestApplication;
  let logger: MockLogger;

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

    logger = new MockLogger();
    gatewayApp = await NestFactory.create<NestFastifyApplication>(
      ApplicationModule,
      new FastifyAdapter(),
      {
        logger,
      },
    );

    await gatewayApp.init();
  });

  it('should trigger preGatewayExecution', async () => {
    await gatewayApp.getHttpAdapter().getInstance().ready();
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
    expect(logger.warn).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenNthCalledWith(
      1,
      'preGatewayExecution',
      'GqlConfigService',
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      2,
      'preGatewayExecution',
      'GqlConfigService',
    );
  });

  it('should trigger onGatewayReplaceSchema', async () => {
    const instance = await gatewayApp.getHttpAdapter().getInstance();
    await instance.ready();

    setTimeout(async () => {
      instance.graphql.gateway.serviceMap.users.setSchema(
        `
      type User @key(fields: "id") {
        id: ID!
        name: String!
        public: Boolean
      }

      extend type Query {
        getUser(id: ID!): User
      }
      `,
      );
    }, 200);
    setTimeout(() => {
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenNthCalledWith(
        1,
        'onGatewayReplaceSchema',
        'GqlConfigService',
      );
    }, 1000);
    await timeout(1001);
  });

  afterEach(async () => {
    await postsApp.close();
    await usersApp.close();
    await gatewayApp.close();
  });
});
