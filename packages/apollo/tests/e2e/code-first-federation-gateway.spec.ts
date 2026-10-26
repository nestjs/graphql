import { IntrospectAndCompose } from '@apollo/gateway';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApolloGatewayDriver } from '../../lib/drivers/index.js';
import { SongsSubgraphModule } from '../code-first-federation-gateway/songs-subgraph.module.js';
import { UsersSubgraphModule } from '../code-first-federation-gateway/users-subgraph.module.js';

describe('Code-first - Federation 1 subgraph composed by a gateway', () => {
  let usersApp: INestApplication;
  let songsApp: INestApplication;
  let gatewayApp: INestApplication;

  beforeEach(async () => {
    const usersModule = await Test.createTestingModule({
      imports: [UsersSubgraphModule],
    }).compile();

    usersApp = usersModule.createNestApplication();
    await usersApp.listen(0, '127.0.0.1');
    const usersPort = usersApp.getHttpServer().address().port;

    const songsModule = await Test.createTestingModule({
      imports: [SongsSubgraphModule],
    }).compile();

    songsApp = songsModule.createNestApplication();
    await songsApp.listen(0, '127.0.0.1');
    const songsPort = songsApp.getHttpServer().address().port;

    const gatewayModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot({
          driver: ApolloGatewayDriver,
          gateway: {
            includeStacktraceInErrorResponses: false,
            supergraphSdl: new IntrospectAndCompose({
              subgraphs: [
                { name: 'users', url: `http://127.0.0.1:${usersPort}/graphql` },
                { name: 'songs', url: `http://127.0.0.1:${songsPort}/graphql` },
              ],
            }),
          },
        }),
      ],
    }).compile();

    gatewayApp = gatewayModule.createNestApplication();
    await gatewayApp.init();
  });

  afterEach(async () => {
    await gatewayApp?.close();
    await usersApp?.close();
    await songsApp?.close();
  });

  it('should run lookup across boundaries', () => {
    return request(gatewayApp.getHttpServer())
      .post('/graphql')
      .send({
        query: `
        {
          user {
            id
            name
            favoriteSong {
              id
              title
            }
          }
        }`,
      })
      .expect(200, {
        data: {
          user: {
            id: '1',
            name: 'John',
            favoriteSong: { id: '10', title: 'Song 10' },
          },
        },
      });
  });
});
