import { DynamicModule, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GRAPHQL_TRANSPORT_WS_PROTOCOL } from 'graphql-ws';
import ws from 'ws';
import { AppModule } from './app/app.module.js';
import { FederationAppModule } from './federation-app/federation-app.module.js';

const cases: Array<[string, () => DynamicModule]> = [
  [
    'ApolloDriver',
    () => AppModule.forRoot({ subscriptions: { 'graphql-ws': {} } }),
  ],
  [
    'ApolloFederationDriver',
    () => FederationAppModule.forRoot({ subscriptions: { 'graphql-ws': {} } }),
  ],
];

describe.each(cases)('graphql-ws shutdown (%s)', (_name, moduleFactory) => {
  let app: INestApplication;
  let socket: ws | undefined;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [moduleFactory()],
    }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });

  afterEach(() => {
    socket?.terminate();
  });

  it('closes open graphql-ws connections when the application closes', async () => {
    const { port } = app.getHttpServer().address();
    socket = new ws(
      `ws://127.0.0.1:${port}/graphql`,
      GRAPHQL_TRANSPORT_WS_PROTOCOL,
    );
    const client = socket;
    await new Promise<void>((resolve, reject) => {
      client.once('error', reject);
      client.once('open', () =>
        client.send(JSON.stringify({ type: 'connection_init' })),
      );
      client.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'connection_ack') {
          resolve();
        }
      });
    });

    const closed = new Promise<number>((resolve) =>
      client.once('close', (code) => resolve(code)),
    );
    const timeout = new Promise<string>((resolve) =>
      setTimeout(() => resolve('not closed'), 2000),
    );
    // Don't await app.close() itself: a lingering socket may keep it pending.
    void app.close();

    expect(await Promise.race([closed, timeout])).toBe(1001);
  });
});
