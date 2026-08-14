import {
  execute as graphqlExecute,
  GraphQLSchema,
  subscribe as graphqlSubscribe,
} from 'graphql';
import {
  Disposable,
  GRAPHQL_TRANSPORT_WS_PROTOCOL,
  ServerOptions,
} from 'graphql-ws';
import { useServer } from 'graphql-ws/use/ws';
import {
  GRAPHQL_WS,
  SubscriptionServer,
  ServerOptions as SubscriptionTransportWsServerOptions,
} from 'subscriptions-transport-ws';
import { WebSocketServer } from 'ws';

export type GraphQLWsSubscriptionsConfig = Partial<
  Pick<
    ServerOptions,
    | 'connectionInitWaitTimeout'
    | 'onConnect'
    | 'onDisconnect'
    | 'onClose'
    | 'onSubscribe'
    | 'onNext'
  >
> & {
  path?: string;
  /**
   * A custom WebSocket server instance to use instead of the default
   * `ws` WebSocketServer. When provided, the default WebSocket server
   * will not be created for this protocol.
   */
  server?: WebSocketServer;
};

export type GraphQLSubscriptionTransportWsConfig = Partial<
  Pick<
    SubscriptionTransportWsServerOptions,
    'onConnect' | 'onDisconnect' | 'onOperation' | 'keepAlive'
  >
> & {
  path?: string;
  /**
   * A custom WebSocket server instance to use instead of the default
   * `ws` WebSocketServer. When provided, the default WebSocket server
   * will not be created for this protocol.
   */
  server?: WebSocketServer;
};

export type SubscriptionConfig = {
  'graphql-ws'?: GraphQLWsSubscriptionsConfig | boolean;
  'subscriptions-transport-ws'?: GraphQLSubscriptionTransportWsConfig | boolean;
};

export interface GqlSubscriptionServiceOptions extends SubscriptionConfig {
  schema: GraphQLSchema;
  execute?: typeof graphqlExecute;
  subscribe?: typeof graphqlSubscribe;
  path?: string;
  context?: ServerOptions['context'];
}

export class GqlSubscriptionService {
  private readonly wss: WebSocketServer;
  private readonly subTransWs: WebSocketServer;
  private wsGqlDisposable: Disposable;
  private subServer: SubscriptionServer;

  constructor(
    private readonly options: GqlSubscriptionServiceOptions,
    private readonly httpServer: any,
  ) {
    const graphqlWsConfig = this.options[
      'graphql-ws'
    ] as GraphQLWsSubscriptionsConfig;
    this.wss =
      (typeof graphqlWsConfig === 'object' && graphqlWsConfig?.server) ||
      new WebSocketServer({
        path: graphqlWsConfig?.path ?? this.options.path,
        noServer: true,
      });

    const subTransWsConfig = this.options[
      'subscriptions-transport-ws'
    ] as GraphQLSubscriptionTransportWsConfig;
    this.subTransWs =
      (typeof subTransWsConfig === 'object' && subTransWsConfig?.server) ||
      new WebSocketServer({
        path: subTransWsConfig?.path ?? this.options.path,
        noServer: true,
      });
    this.initialize();
  }

  private initialize() {
    const supportedProtocols = [];
    const { execute = graphqlExecute, subscribe = graphqlSubscribe } =
      this.options;

    if ('graphql-ws' in this.options) {
      const {
        server: _wsServer,
        path: _wsPath,
        ...graphqlWsOptions
      } =
        this.options['graphql-ws'] === true
          ? ({} as GraphQLWsSubscriptionsConfig)
          : (this.options['graphql-ws'] as GraphQLWsSubscriptionsConfig);
      supportedProtocols.push(GRAPHQL_TRANSPORT_WS_PROTOCOL);
      this.wsGqlDisposable = useServer(
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
      const {
        server: _subServer,
        path: _subPath,
        ...subscriptionsWsOptions
      } =
        this.options['subscriptions-transport-ws'] === true
          ? ({} as GraphQLSubscriptionTransportWsConfig)
          : (this.options[
              'subscriptions-transport-ws'
            ] as GraphQLSubscriptionTransportWsConfig);

      supportedProtocols.push(GRAPHQL_WS);
      this.subServer = SubscriptionServer.create(
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

      const isSubTransWs =
        protocols?.includes(GRAPHQL_WS) && // subscriptions-transport-ws subprotocol
        !protocols.includes(GRAPHQL_TRANSPORT_WS_PROTOCOL); // graphql-ws subprotocol

      const wss = isSubTransWs ? this.subTransWs : this.wss;
      const subConfig = isSubTransWs
        ? (this.options[
            'subscriptions-transport-ws'
          ] as GraphQLSubscriptionTransportWsConfig)
        : (this.options['graphql-ws'] as GraphQLWsSubscriptionsConfig);

      const path =
        (typeof subConfig === 'object' && subConfig?.path) ||
        this.options.path ||
        wss?.options?.path;

      if (!path || req.url?.startsWith(path)) {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      }
    });
  }

  async stop() {
    await this.wsGqlDisposable?.dispose();
    this.subServer?.close();
  }
}
