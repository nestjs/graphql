import { INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule as PostsModule } from '../graphql-federation/posts-service/federation-posts.module';
import { AppModule as UsersModule } from '../graphql-federation/users-service/federation-users.module';
import { AppModule as GatewayModule } from '../plugins/graphql-federation-plugin/gateway/gateway.module';
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

  it('should get the plugin url', () => {
    return request(gatewayApp.getHttpServer())
      .get(BASE_PLUGIN_URL)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({
        from: BASE_PLUGIN_URL,
      });
  });

  afterEach(async () => {
    await postsApp.close();
    await usersApp.close();
    await gatewayApp.close();
  });
});
