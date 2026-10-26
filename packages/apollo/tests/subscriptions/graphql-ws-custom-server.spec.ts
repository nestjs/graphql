import { DynamicModule, INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { GRAPHQL_TRANSPORT_WS_PROTOCOL } from 'graphql-ws';
import ws, { WebSocketServer } from 'ws';
import { AppModule } from './app/app.module.js';
import { FederationAppModule } from './federation-app/federation-app.module.js';

type ModuleFactory = (server: WebSocketServer) => DynamicModule;

const cases: Array<[string, ModuleFactory, () => FastifyAdapter | undefined]> =
  [
    [
      'ApolloDriver, Express',
      (server) =>
        AppModule.forRoot({ subscriptions: { 'graphql-ws': { server } } }),
      () => undefined,
    ],
    [
      'ApolloDriver, Fastify',
      (server) =>
        AppModule.forRoot({ subscriptions: { 'graphql-ws': { server } } }),
      () => new FastifyAdapter(),
    ],
    [
      'ApolloFederationDriver, Express',
      (server) =>
        FederationAppModule.forRoot({
          subscriptions: { 'graphql-ws': { server } },
        }),
      () => undefined,
    ],
  ];

const withTimeout = <T>(promise: Promise<T>, ms = 2000) =>
  Promise.race([
    promise,
    new Promise<string>((resolve) => setTimeout(() => resolve('timeout'), ms)),
  ]);

const connect = (url: string, protocol = GRAPHQL_TRANSPORT_WS_PROTOCOL) => {
  const socket = new ws(url, protocol);
  const acked = new Promise<void>((resolve, reject) => {
    socket.once('error', reject);
    socket.once('open', () =>
      socket.send(JSON.stringify({ type: 'connection_init' })),
    );
    socket.on('message', (data) => {
      if (JSON.parse(data.toString()).type === 'connection_ack') {
        resolve();
      }
    });
  });
  const closed = new Promise<number>((resolve) =>
    socket.once('close', (code) => resolve(code)),
  );
  return { socket, acked, closed };
};

describe.each(cases)(
  'graphql-ws custom server (%s)',
  (_name, moduleFactory, adapterFactory) => {
    let app: INestApplication;
    let server: WebSocketServer;
    let port: number;
    let socket: ws | undefined;
    let closing: Promise<void> | undefined;
    const onConnection = vi.fn();

    beforeEach(async () => {
      onConnection.mockClear();
      server = new WebSocketServer({
        noServer: true,
        path: '/subscriptions',
        maxPayload: 1024,
      });
      server.on('connection', onConnection);

      const module = await Test.createTestingModule({
        imports: [moduleFactory(server)],
      }).compile();
      const adapter = adapterFactory();
      app = adapter
        ? module.createNestApplication(adapter)
        : module.createNestApplication();
      await app.listen(0, '127.0.0.1');
      port = app.getHttpServer().address().port;
    });

    afterEach(async () => {
      socket?.terminate();
      socket = undefined;
      await (closing ?? app.close());
      closing = undefined;
    });

    it('routes connections on its own path to the custom server', async () => {
      const client = connect(`ws://127.0.0.1:${port}/subscriptions`);
      socket = client.socket;

      expect(await withTimeout(client.acked.then(() => 'acked'))).toBe('acked');
      expect(onConnection).toHaveBeenCalledTimes(1);
      expect(server.clients.size).toBe(1);
    });

    it('applies the options of the custom server', async () => {
      const client = connect(`ws://127.0.0.1:${port}/subscriptions`);
      socket = client.socket;
      await client.acked;

      client.socket.send('x'.repeat(2048));

      // 1009: message too big, enforced by the custom server's maxPayload
      expect(await withTimeout(client.closed)).toBe(1009);
    });

    it('closes the custom server when the application closes', async () => {
      const client = connect(`ws://127.0.0.1:${port}/subscriptions`);
      socket = client.socket;
      await client.acked;

      // Don't await app.close() itself: a lingering socket may keep it pending.
      closing = app.close();

      expect(await withTimeout(client.closed)).toBe(1001);
      // graphql-ws disposed the server: its listeners are gone
      expect(server.listenerCount('connection')).toBe(0);
      await vi.waitFor(() => expect(server.clients.size).toBe(0));
    });
  },
);

describe('graphql-ws custom server validation', () => {
  it('rejects a server that was not created with "noServer: true"', async () => {
    const server = new WebSocketServer({ port: 0, host: '127.0.0.1' });
    try {
      const module = await Test.createTestingModule({
        imports: [
          AppModule.forRoot({ subscriptions: { 'graphql-ws': { server } } }),
        ],
      }).compile();
      const app = module.createNestApplication();

      await expect(app.init()).rejects.toThrow(
        'Custom WebSocketServer passed to "graphql-ws" must be instantiated with "noServer: true".',
      );
      await app.close();
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});

describe('graphql-ws default server', () => {
  let app: INestApplication;
  let socket: ws | undefined;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.forRoot({ subscriptions: { 'graphql-ws': {} } })],
    }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });

  afterEach(async () => {
    socket?.terminate();
    await app.close();
  });

  it('answers upgrades that use an unsupported subprotocol', async () => {
    const { port } = app.getHttpServer().address();
    // "graphql-ws" is the subprotocol of the legacy subscriptions-transport-ws
    const client = connect(`ws://127.0.0.1:${port}/graphql`, 'graphql-ws');
    socket = client.socket;

    expect(
      await withTimeout(client.acked.catch((err: Error) => err.message)),
    ).toBe('Server sent no subprotocol');
  });
});
