import { execute, GraphQLSchema, subscribe } from 'graphql';
import { GRAPHQL_TRANSPORT_WS_PROTOCOL, ServerOptions } from 'graphql-ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { GRAPHQL_WS, SubscriptionServer } from 'subscriptions-transport-ws';
import * as ws from 'ws';
import {
  GraphQLSubscriptionTransportWsConfig,
  GraphQLWsSubscriptionsConfig,
  SubscriptionConfig,
} from '../interfaces/gql-module-options.interface';

export interface GraphQLSubscriptionServiceOptions extends SubscriptionConfig {
  schema: GraphQLSchema;
  path?: string;
  context?: ServerOptions['context'];
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
      useServer(
        {
          schema: this.options.schema,
          execute,
          subscribe,
          context: this.options.context,
          ...graphqlWsOptions,
        },
        this.wss,
      );
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

      protocols = protocols.filter((protocol) =>
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

  async stop() {
    for (const client of this.wss.clients) {
      client.close(1001, 'Going away');
    }
    for (const client of this.subTransWs.clients) {
      client.close(1001, 'Going away');
    }
  }
}
