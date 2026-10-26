import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { MercuriusGatewayDriver } from '../../lib/drivers/index.js';
import { MediaSubgraphModule } from '../federated-union/media-subgraph.module.js';
import { UsersSubgraphModule } from '../federated-union/users-subgraph.module.js';

describe('Federated union of entity references', () => {
  let usersApp: INestApplication;
  let mediaApp: INestApplication;
  let gatewayApp: INestApplication;

  beforeEach(async () => {
    usersApp = (
      await Test.createTestingModule({
        imports: [UsersSubgraphModule],
      }).compile()
    ).createNestApplication(new FastifyAdapter());
    await usersApp.listen(0, '127.0.0.1');
    const usersPort = usersApp.getHttpServer().address().port;

    mediaApp = (
      await Test.createTestingModule({
        imports: [MediaSubgraphModule],
      }).compile()
    ).createNestApplication(new FastifyAdapter());
    await mediaApp.listen(0, '127.0.0.1');
    const mediaPort = mediaApp.getHttpServer().address().port;

    gatewayApp = (
      await Test.createTestingModule({
        imports: [
          GraphQLModule.forRoot({
            driver: MercuriusGatewayDriver,
            gateway: {
              services: [
                { name: 'users', url: `http://127.0.0.1:${usersPort}/graphql` },
                { name: 'media', url: `http://127.0.0.1:${mediaPort}/graphql` },
              ],
            },
          }),
        ],
      }).compile()
    ).createNestApplication(new FastifyAdapter());
    await gatewayApp.init();
    await gatewayApp.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await gatewayApp.close();
    await usersApp.close();
    await mediaApp.close();
  });

  it('resolves entity members of a union returned by a Query (control)', async () => {
    const res = await request(gatewayApp.getHttpServer())
      .post('/graphql')
      .send({
        query: `{ getFavoriteItem { __typename ... on Movie { id name } ... on Song { id title } } }`,
      });
    expect(res.body).toEqual({
      data: {
        getFavoriteItem: { __typename: 'Movie', id: '2', name: 'Movie 2' },
      },
    });
  });

  it('resolves entity members of a union used as an object field type', async () => {
    const res = await request(gatewayApp.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          getUserById(id: "1") {
            id
            firstName
            favoriteItem { __typename ... on Song { id title } ... on Movie { id name } }
          }
        }`,
      });
    expect(res.body).toEqual({
      data: {
        getUserById: {
          id: '1',
          firstName: 'John',
          favoriteItem: { __typename: 'Song', id: '1', title: 'Song 1' },
        },
      },
    });
  });

  it('resolves entity members of a union returned by a @ResolveField', async () => {
    const res = await request(gatewayApp.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          getUserById(id: "1") {
            id
            resolvedFavoriteItem { __typename ... on Song { id title } ... on Movie { id name } }
          }
        }`,
      });
    expect(res.body).toEqual({
      data: {
        getUserById: {
          id: '1',
          resolvedFavoriteItem: {
            __typename: 'Movie',
            id: '2',
            name: 'Movie 2',
          },
        },
      },
    });
  });
});
