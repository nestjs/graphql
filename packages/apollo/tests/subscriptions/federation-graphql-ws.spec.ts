import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { InMemoryCache } from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';
import { gql } from 'graphql-tag';
import { Client, createClient } from 'graphql-ws';
import request from 'supertest';
import ws from 'ws';
import { FederationAppModule } from './federation-app/federation-app.module';
import { pubSub } from './federation-app/notification.resolver';
import { GraphQLWsLink } from './utils/graphql-ws.link';

const subscriptionQuery = gql`
  subscription FederatedSubscription($id: String!, $recipient: String!) {
    newFederatedNotification(id: $id, recipient: $recipient) {
      id
      recipient
      message
    }
  }
`;

describe('GraphQL Federation - graphql-ws subscriptions', () => {
  let app: INestApplication;
  let wsClient: Client;
  let port: number;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        FederationAppModule.forRoot({
          subscriptions: { 'graphql-ws': {} },
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    await app.listen(0);
    port = app.getHttpServer().address().port;
  });

  afterEach(async () => {
    try {
      await wsClient?.dispose();
    } catch {}
    await app.close();
  });

  it('should connect and receive a filtered notification', async () => {
    wsClient = createClient({
      url: `ws://localhost:${port}/graphql`,
      webSocketImpl: ws,
      retryAttempts: 0,
    });

    wsClient.on('connected', () => {
      setTimeout(() => {
        pubSub.publish('newFederatedNotification', {
          newFederatedNotification: {
            id: '99',
            recipient: 'alice',
            message: 'wrong id',
          },
        });
        pubSub.publish('newFederatedNotification', {
          newFederatedNotification: {
            id: '1',
            recipient: 'bob',
            message: 'wrong recipient',
          },
        });
        pubSub.publish('newFederatedNotification', {
          newFederatedNotification: {
            id: '1',
            recipient: 'alice',
            message: 'Hello from federation',
          },
        });
      }, 100);
    });

    const apolloClient = new ApolloClient({
      link: new GraphQLWsLink(wsClient),
      cache: new InMemoryCache(),
    });

    await new Promise<void>((resolve, reject) => {
      apolloClient
        .subscribe({
          query: subscriptionQuery,
          variables: { id: '1', recipient: 'alice' },
        })
        .subscribe({
          next(value: any) {
            try {
              expect(value.data.newFederatedNotification.id).toEqual('1');
              expect(value.data.newFederatedNotification.recipient).toEqual(
                'alice',
              );
              expect(value.data.newFederatedNotification.message).toEqual(
                'Hello from federation',
              );
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          complete() {},
          error: reject,
        });
    });
  });

  it('should expose the Subscription type in the federation SDL', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ _service { sdl } }' })
      .expect(200);

    const sdl: string = response.body.data._service.sdl;
    expect(sdl).toContain('type Subscription');
    expect(sdl).toContain('newFederatedNotification');
  });
});
