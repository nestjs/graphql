import { INestApplication, Injectable, Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  ApolloGatewayDriverConfig,
  ApolloGatewayDriverConfigFactory,
} from '../../lib';
import { ApolloGatewayDriver } from '../../lib/drivers';
import { getSupergraphSdl } from '../graphql-federation/gateway/supergraph-sdl';
import { AppModule as PostsModule } from '../graphql-federation/posts-service/federation-posts.module';
import { AppModule as UsersModule } from '../graphql-federation/users-service/federation-users.module';

let usersPort: number;
let postsPort: number;

@Injectable()
class GatewayConfigService implements ApolloGatewayDriverConfigFactory {
  createGqlOptions(): Partial<ApolloGatewayDriverConfig> {
    return {
      gateway: {
        supergraphSdl: getSupergraphSdl(usersPort, postsPort),
      },
    };
  }
}

@Module({
  providers: [GatewayConfigService],
  exports: [GatewayConfigService],
})
class GatewayConfigModule {}

describe('GraphQL gateway async-existing', () => {
  let postsApp: INestApplication;
  let usersApp: INestApplication;
  let gatewayApp: INestApplication;

  beforeEach(async () => {
    const usersModule = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    usersApp = usersModule.createNestApplication();
    await usersApp.listen(0);
    usersPort = usersApp.getHttpServer().address().port;

    const postsModule = await Test.createTestingModule({
      imports: [PostsModule],
    }).compile();

    postsApp = postsModule.createNestApplication();
    await postsApp.listen(0);
    postsPort = postsApp.getHttpServer().address().port;

    const gatewayModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
          driver: ApolloGatewayDriver,
          useExisting: GatewayConfigService,
          imports: [GatewayConfigModule],
        }),
      ],
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

  afterEach(async () => {
    await postsApp.close();
    await usersApp.close();
    await gatewayApp.close();
  });
});
