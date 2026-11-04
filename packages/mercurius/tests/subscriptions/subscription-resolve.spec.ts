import { INestApplication, Module, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  GraphQLModule,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { gql } from 'graphql-tag';
import { PubSub } from 'mercurius';
import { createMercuriusTestClient } from 'mercurius-integration-testing';
import { EventEmitter } from 'stream';
import { MercuriusDriverConfig } from '../../lib/index.js';
import { MercuriusDriver } from '../../lib/drivers/index.js';
import { AuthGuard } from './app/auth.guard.js';
import { Notification } from './app/notification.js';

class CustomPubSub {
  emitter = new EventEmitter();

  async subscribe(topic: string, queue: any) {
    const listener = (value) => queue.push(value);
    this.emitter.on(topic, listener);
    queue.close = () => this.emitter.removeListener(topic, listener);
  }

  publish(event: any, callback = () => {}) {
    this.emitter.emit(event.topic, event.payload);
    callback();
  }
}

const pubsub = new CustomPubSub();

@Resolver(() => Notification)
class ShoutingNotificationResolver {
  @Query(() => Notification)
  getNotification() {
    return { id: '0', recipient: 'test', message: 'Hello!' };
  }

  @UseGuards(AuthGuard)
  @Subscription(() => Notification, {
    filter(payload, variables, context) {
      return context.user === payload.newNotification.recipient;
    },
    resolve(payload) {
      return {
        ...payload.newNotification,
        message: payload.newNotification.message.toUpperCase(),
      };
    },
  })
  newNotification(
    @Args('id', { nullable: false }) _id: string,
    @Context('pubsub') pubSub: PubSub,
  ) {
    return pubSub.subscribe('newNotification');
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      autoSchemaFile: true,
      subscription: {
        pubsub,
        context: (_conn, request: any) => {
          const { authorization } = request.raw?.headers ?? {};
          return authorization
            ? { user: authorization.split('Bearer ')[1] }
            : {};
        },
      },
    }),
  ],
  providers: [ShoutingNotificationResolver],
})
class AppModule {}

describe('Subscriptions with a "resolve" option', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should resolve the events of a subscription', async () => {
    await new Promise<void>((resolve, reject) => {
      const testClient = createMercuriusTestClient(
        app.getHttpAdapter().getInstance(),
      );
      testClient
        .subscribe({
          query: gql`
            subscription {
              newNotification(id: "1") {
                id
                message
              }
            }
          `,
          headers: { authorization: 'Bearer test' },
          onData(response) {
            try {
              expect(response.data).toEqual({
                newNotification: { id: '1', message: 'HELLO WS' },
              });
              resolve();
            } catch (e) {
              reject(e);
            }
          },
        })
        .then(() => {
          // timeout needed to allow the subscription to be established
          setTimeout(
            () =>
              pubsub.publish({
                topic: 'newNotification',
                payload: {
                  newNotification: {
                    id: '1',
                    recipient: 'test',
                    message: 'Hello ws',
                  },
                },
              }),
            1000,
          );
        })
        .catch(reject);
    });
  });

  it('should not run "resolve" for a subscription sent over HTTP', async () => {
    const response = await app
      .getHttpAdapter()
      .getInstance()
      .inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: 'subscription { newNotification(id: "1") { id message } }',
        },
      });

    const body = response.json();
    expect(body.data?.newNotification ?? null).toBeNull();
    expect(body.errors).toHaveLength(1);
  });
});
