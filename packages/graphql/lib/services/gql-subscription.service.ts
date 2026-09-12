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
   * will not be created.
   *
   * Note: The custom server must be instantiated with `{ noServer: true }`
   * so that NestJS can handle the HTTP upgrade routing.
   */
  server?: WebSocketServer;
};

export type SubscriptionConfig = {
  'graphql-ws'?: GraphQLWsSubscriptionsConfig | boolean;
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
  private wsGqlDisposable: Disposable;

  constructor(
    private readonly options: GqlSubscriptionServiceOptions,
    private readonly httpServer: any,
  ) {
    const graphqlWsConfig = this.options[
      'graphql-ws'
    ] as GraphQLWsSubscriptionsConfig;

    if (
      typeof graphqlWsConfig === 'object' &&
      graphqlWsConfig?.server &&
      graphqlWsConfig.server.options?.noServer === false
    ) {
      throw new Error(
        'Custom WebSocketServer passed to "graphql-ws" must be instantiated with "noServer: true".',
      );
    }

    this.wss =
      (typeof graphqlWsConfig === 'object' && graphqlWsConfig?.server) ||
      new WebSocketServer({
        path: graphqlWsConfig?.path ?? this.options.path,
        noServer: true,
      });
    this.initialize();
  }

  private initialize() {
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

    this.httpServer.on('upgrade', (req, socket, head) => {
      const protocol = req.headers['sec-websocket-protocol'] as
        | string
        | string[]
        | undefined;
      let protocols = Array.isArray(protocol)
        ? protocol
        : protocol?.split(',').map((p) => p.trim());

      protocols = protocols?.filter(
        (supportedProtocol) =>
          supportedProtocol === GRAPHQL_TRANSPORT_WS_PROTOCOL,
      );

      if (protocol && (!protocols || protocols.length === 0)) {
        return;
      }

      const wss = this.wss;
      const subConfig = this.options[
        'graphql-ws'
      ] as GraphQLWsSubscriptionsConfig;

      const path =
        wss?.options?.path ??
        (typeof subConfig === 'object' && subConfig?.path) ??
        this.options.path;

      if (path && req.url?.startsWith(path)) {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      }
    });
  }

  async stop() {
    await this.wsGqlDisposable?.dispose();
  }
}
