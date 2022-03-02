import { INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { gql } from 'graphql-tag';
import { createMercuriusTestClient } from 'mercurius-integration-testing';
import { EventEmitter } from 'stream';
import { AppModule } from './app/app.module';

class CustomPubSub {
  emitter: EventEmitter;
  constructor() {
    this.emitter = new EventEmitter();
  }

  async subscribe(topic: string, queue: any) {
    const listener = (value) => {
      queue.push(value);
    };

    const close = () => {
      this.emitter.removeListener(topic, listener);
    };

    this.emitter.on(topic, listener);
    queue.close = close;
  }

  publish(event: any, callback = () => {}) {
    this.emitter.emit(event.topic, event.payload);
    callback();
  }
}

const pubsub = new CustomPubSub();

const subscriptionQuery = gql`
  subscription TestSubscription($id: String!) {
    newNotification(id: $id) {
      id
      message
    }
  }
`;

describe('Subscriptions', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        AppModule.forRoot({
          subscription: {
            // verifyClient: (info, next) => {
            //   if (!info.req.headers) {
            //     return next(false, 4000, 'Missing authorization');
            //   }
            //   const authorization = info.req.headers.authorization as string;
            //   if (!authorization.startsWith('Bearer ')) {
            //     return next(false);
            //   }
            //   next(true);
            // },
            pubsub,
            context: (conn, request: any) => {
              const { authorization } = request.raw?.headers ?? {};
              if (authorization) {
                return { user: authorization.split('Bearer ')[1] };
              } else {
                return {};
              }
            },
          },
        }),
      ],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.listen(3077);
  });

  it('should receive error on subscription if guard fails', (done) => {
    const testClient = createMercuriusTestClient(
      app.getHttpAdapter().getInstance(),
    );
    const examplePayload = {
      newNotification: {
        id: '1',
        recipient: 'test',
        message: 'Hello ws',
      },
    };
    testClient
      .subscribe({
        query: subscriptionQuery,
        variables: {
          id: '1',
        },
        headers: {
          authorization: 'test',
        },
        onData(response) {
          expect(response.errors[0].message).toEqual('Forbidden resource');
          done();
        },
      })
      .then(() => {
        // timeout needed to allow the subscription to be established
        setTimeout(
          () =>
            pubsub.publish({
              topic: 'newNotification',
              payload: examplePayload,
            }),
          1000,
        );
      })
      .catch(console.log);
  });

  it('should connect to subscriptions', (done) => {
    const testClient = createMercuriusTestClient(
      app.getHttpAdapter().getInstance(),
    );
    const examplePayload = {
      newNotification: {
        id: '1',
        recipient: 'test',
        message: 'Hello ws',
      },
    };
    testClient
      .subscribe({
        query: subscriptionQuery,
        variables: {
          id: '1',
        },
        headers: {
          authorization: 'Bearer test',
        },
        onData(response) {
          expect(response.data).toEqual({
            newNotification: {
              id: examplePayload.newNotification.id,
              message: examplePayload.newNotification.message,
            },
          });
          done();
        },
      })
      .then(() => {
        // timeout needed to allow the subscription to be established
        setTimeout(
          () =>
            pubsub.publish({
              topic: 'newNotification',
              payload: examplePayload,
            }),
          1000,
        );
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
