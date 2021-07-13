import { execute, GraphQLSchema, subscribe } from 'graphql';
import { GRAPHQL_TRANSPORT_WS_PROTOCOL, ServerOptions } from 'graphql-ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { IncomingMessage } from 'http';
import { GRAPHQL_WS, SubscriptionServer } from 'subscriptions-transport-ws';
import * as ws from 'ws';

export type WebSocket = typeof ws.prototype;

export interface GraphQLWsSubscriptionServiceOptions {
  schema: ServerOptions['schema'];
  onConnect?: ServerOptions['onConnect'];
  onDisconnect?: ServerOptions['onDisconnect'];
  context?: ServerOptions['context'];
  keepAlive?: number;
}

export interface Extra {
  readonly socket: WebSocket;
  readonly request: IncomingMessage;
}

export class GraphQLWsSubscriptionService {
  private readonly wss: ws.Server;
  private readonly subTransWs: ws.Server;

  constructor(
    private readonly options: GraphQLWsSubscriptionServiceOptions,
    private readonly httpServer: any,
  ) {
    this.wss = new ws.Server({
      noServer: true,
    });
    this.subTransWs = new ws.Server({ noServer: true });
    this.initialize();
  }

  private initialize() {
    useServer(
      {
        schema: this.options.schema,
        execute,
        subscribe,
        context: this.options.context,
        onConnect: this.options.onConnect,
        onDisconnect: this.options.onDisconnect,
      },
      this.wss,
    );

    SubscriptionServer.create(
      {
        schema: this.options.schema as GraphQLSchema,
        execute,
        subscribe,
      },
      this.subTransWs,
    );

    this.httpServer.on('upgrade', (req, socket, head) => {
      const protocol = req.headers['sec-websocket-protocol'];
      const protocols = Array.isArray(protocol)
        ? protocol
        : protocol?.split(',').map((p) => p.trim());

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

  async stop() {
    for (const client of this.wss.clients) {
      client.close(1001, 'Going away');
    }
    for (const client of this.subTransWs.clients) {
      client.close(1001, 'Going away');
    }
  }
}
