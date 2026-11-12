import {
  execute as graphqlExecute,
  GraphQLSchema,
  subscribe as graphqlSubscribe,
} from 'graphql';
import { Disposable, ServerOptions } from 'graphql-ws';
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
    | 'onError'
    | 'validate'
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
  /**
   * How many milliseconds an upgrade request for another path is left open
   * when another `upgrade` listener on the same server may claim it. A socket
   * that nothing has been written to by then is closed. Raise it when another
   * listener answers the handshake late, for example after a slow
   * authentication, or set it to `0` to leave such sockets to the other
   * listeners entirely.
   *
   * @default 1000
   */
  unclaimedUpgradeTimeout?: number;
};

const DEFAULT_UNCLAIMED_UPGRADE_TIMEOUT = 1000;

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

    const graphqlWsConfig = this.options['graphql-ws'];
    if (!graphqlWsConfig) {
      // No protocol handler would listen on the WebSocket server: leave upgrade
      // requests to the HTTP server rather than completing handshakes on
      // sockets that nothing reads from.
      return;
    }

    const {
      server: _wsServer,
      path: _wsPath,
      unclaimedUpgradeTimeout = DEFAULT_UNCLAIMED_UPGRADE_TIMEOUT,
      ...graphqlWsOptions
    } = graphqlWsConfig === true
      ? ({} as GraphQLWsSubscriptionsConfig)
      : graphqlWsConfig;
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

    this.httpServer.on('upgrade', (req, socket, head) => {
      // Match the whole path, as "WebSocketServer#shouldHandle()" does: a
      // prefix match would also claim requests that another upgrade listener
      // owns, and a socket handed to two servers crashes the process.
      const pathname = req.url?.split('?', 1)[0];

      if (this.path && pathname === this.path) {
        const wss = this.wss;
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
        return;
      }

      // Node.js detaches its own listeners from the socket before emitting
      // "upgrade", so a socket that nobody claims has no "error" listener and
      // a connection reset would crash the process. When no other listener
      // can claim it, close it right away.
      socket.on('error', () => socket.destroy());
      if (this.httpServer.listenerCount('upgrade') <= 1) {
        socket.destroy();
      } else if (unclaimedUpgradeTimeout > 0) {
        // A listener that claims the socket answers the handshake, so a socket
        // nothing has been written to by then is one that nobody claimed. The
        // HTTP server's timeouts no longer apply after "upgrade", so it would
        // otherwise stay open until the client hangs up. The count covers the
        // whole connection, so on a keep-alive connection it already includes
        // the responses to earlier requests.
        const writtenBeforeUpgrade = socket.bytesWritten;
        setTimeout(() => {
          if (socket.writable && socket.bytesWritten <= writtenBeforeUpgrade) {
            socket.destroy();
          }
        }, unclaimedUpgradeTimeout).unref();
      }
    });
  }

  async stop() {
    await this.wsGqlDisposable?.dispose();
  }
}
