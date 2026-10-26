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

/**
 * The members of a `ws` `WebSocketServer` that Nest relies on. Typed
 * structurally, so that the public types of `@nestjs/graphql` don't depend on
 * `@types/ws`: pass a `new WebSocketServer({ noServer: true, ... })` instance.
 */
export interface GraphQLWsServer {
  options: { noServer?: boolean; path?: string };
  handleUpgrade(
    request: any,
    socket: any,
    upgradeHead: any,
    callback: (client: any, request: any) => void,
  ): void;
  emit(event: 'connection', ...args: any[]): boolean;
}

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
   * A `ws` WebSocketServer to use instead of the default one, e.g. to set
   * `perMessageDeflate`, `maxPayload` or `verifyClient`.
   *
   * It must be created with `{ noServer: true }`: Nest routes the HTTP
   * upgrade requests to it. Its `path`, when set, takes precedence over
   * `path` above and the GraphQL module path.
   *
   * The server is handed over to graphql-ws, which replaces its
   * `handleProtocols` option and, on application shutdown, closes it and
   * removes all of its listeners. Use a separate server per GraphQL module.
   */
  server?: GraphQLWsServer;
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
  private readonly path?: string;
  private wsGqlDisposable: Disposable;

  constructor(
    private readonly options: GqlSubscriptionServiceOptions,
    private readonly httpServer: any,
  ) {
    const graphqlWsConfig =
      typeof this.options['graphql-ws'] === 'object'
        ? this.options['graphql-ws']
        : undefined;
    const customServer = graphqlWsConfig?.server;

    if (customServer && !customServer.options?.noServer) {
      throw new Error(
        'Custom WebSocketServer passed to "graphql-ws" must be instantiated with "noServer: true".',
      );
    }

    this.path =
      customServer?.options.path ?? graphqlWsConfig?.path ?? this.options.path;
    this.wss =
      (customServer as WebSocketServer | undefined) ??
      new WebSocketServer({
        path: this.path,
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
      } = this.options['graphql-ws'] === true
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

      const wss = this.wss;

      if (this.path && req.url?.startsWith(this.path)) {
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
