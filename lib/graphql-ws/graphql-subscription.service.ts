import { execute, GraphQLSchema, subscribe } from 'graphql';
import {
  GRAPHQL_TRANSPORT_WS_PROTOCOL,
  makeServer,
  ServerOptions,
} from 'graphql-ws';
import { GRAPHQL_WS, SubscriptionServer } from 'subscriptions-transport-ws';
import * as ws from 'ws';
import {
  GraphQLSubscriptionTransportWsConfig,
  GraphQLWsSubscriptionsConfig,
  SubscriptionConfig,
} from '../interfaces/gql-module-options.interface';
import { IncomingMessage } from 'http';
import { GraphqlWsException } from './graphql-ws.exception';

export interface GraphQLSubscriptionServiceOptions extends SubscriptionConfig {
  schema: GraphQLSchema;
  path?: string;
  context?: ServerOptions['context'];
}

type WebSocket = typeof ws.prototype;

interface Extra {
  readonly socket: WebSocket;
  readonly request: IncomingMessage;
}

export class GraphQLSubscriptionService {
  private readonly wss: ws.Server;
  private readonly subTransWs: ws.Server;

  constructor(
    private readonly options: GraphQLSubscriptionServiceOptions,
    private readonly httpServer: any,
  ) {
    this.wss = new ws.Server({
      path:
        (this.options['graphql-ws'] as GraphQLWsSubscriptionsConfig)?.path ??
        this.options.path,
      noServer: true,
    });
    this.subTransWs = new ws.Server({
      path:
        (
          this.options[
            'subscriptions-transport-ws'
          ] as GraphQLSubscriptionTransportWsConfig
        )?.path ?? this.options.path,
      noServer: true,
    });
    this.initialize();
  }

  private initialize() {
    const supportedProtocols = [];

    if ('graphql-ws' in this.options) {
      const graphqlWsOptions =
        this.options['graphql-ws'] === true ? {} : this.options['graphql-ws'];
      supportedProtocols.push(GRAPHQL_TRANSPORT_WS_PROTOCOL);
      this.useGraphQLWsServer(this.wss, {
        schema: this.options.schema,
        execute,
        subscribe,
        context: this.options.context,
        ...graphqlWsOptions,
      });
    }

    if ('subscriptions-transport-ws' in this.options) {
      const subscriptionsWsOptions =
        this.options['subscriptions-transport-ws'] === true
          ? {}
          : this.options['subscriptions-transport-ws'];

      supportedProtocols.push(GRAPHQL_WS);
      SubscriptionServer.create(
        {
          schema: this.options.schema,
          execute,
          subscribe,
          ...subscriptionsWsOptions,
        },
        this.subTransWs,
      );
    }

    this.httpServer.on('upgrade', (req, socket, head) => {
      const protocol = req.headers['sec-websocket-protocol'] as
        | string
        | string[]
        | undefined;
      let protocols = Array.isArray(protocol)
        ? protocol
        : protocol?.split(',').map((p) => p.trim());

      protocols = protocols?.filter((protocol) =>
        supportedProtocols.includes(protocol),
      );

      const wss =
        protocols?.includes(GRAPHQL_WS) && // subscriptions-transport-ws subprotocol
        !protocols.includes(GRAPHQL_TRANSPORT_WS_PROTOCOL) // graphql-ws subprotocol
          ? this.subTransWs
          : this.wss;

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    });
  }

  private useGraphQLWsServer(
    ws: ws.Server,
    options: ServerOptions & GraphQLWsSubscriptionsConfig,
  ) {
    const server = makeServer<Extra>(options);

    ws.on('error', (err) => {
      // catch the first thrown error and re-throw it once all clients have been notified
      let firstErr: Error | null = err;

      // report server errors by erroring out all clients with the same error
      for (const client of ws.clients) {
        try {
          client.close(1011, 'Internal Error');
        } catch (err) {
          firstErr = firstErr ?? err;
        }
      }

      if (firstErr) {
        throw firstErr;
      }
    });

    const keepAlive = options.keepAlive;

    ws.on('connection', (socket, request) => {
      // keep alive through ping-pong messages
      let pongWait: NodeJS.Timeout | null = null;
      const pingInterval =
        keepAlive > 0 && isFinite(keepAlive)
          ? setInterval(() => {
              // ping pong on open sockets only
              if (socket.readyState === socket.OPEN) {
                // terminate the connection after pong wait has passed because the client is idle
                pongWait = setTimeout(() => {
                  socket.terminate();
                }, keepAlive);

                // listen for client's pong and stop socket termination
                socket.once('pong', () => {
                  if (pongWait) {
                    clearTimeout(pongWait);
                    pongWait = null;
                  }
                });

                socket.ping();
              }
            }, keepAlive)
          : null;

      const closed = server.opened(
        {
          protocol: socket.protocol,
          send: (data) =>
            new Promise((resolve, reject) => {
              socket.send(data, (err) => (err ? reject(err) : resolve()));
            }),
          close: (code, reason) => socket.close(code, reason),
          onMessage: (cb) =>
            socket.on('message', async (event) => {
              try {
                await cb(event.toString());
              } catch (err) {
                if (err instanceof GraphqlWsException) {
                  socket.close(err.code, err.reason);
                } else {
                  socket.close(1011, 'Internal error');
                }
              }
            }),
        },
        { socket, request },
      );

      socket.once('close', (code, reason) => {
        if (pongWait) clearTimeout(pongWait);
        if (pingInterval) clearInterval(pingInterval);
        closed(code, reason.toString());
      });
    });
  }

  async stop() {
    for (const client of this.wss.clients) {
      client.close(1001, 'Going away');
    }
    this.wss.removeAllListeners();
    await new Promise<void>((resolve, reject) => {
      this.wss.close((err) => (err ? reject(err) : resolve()));
    });
    for (const client of this.subTransWs.clients) {
      client.close(1001, 'Going away');
    }
  }
}
