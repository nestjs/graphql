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
    this.wss = new WebSocketServer({
      path:
        (this.options['graphql-ws'] as GraphQLWsSubscriptionsConfig)?.path ??
        this.options.path,
      noServer: true,
    });
    this.initialize();
  }

  private initialize() {
    const { execute = graphqlExecute, subscribe = graphqlSubscribe } =
      this.options;

    if ('graphql-ws' in this.options) {
      const graphqlWsOptions =
        this.options['graphql-ws'] === true ? {} : this.options['graphql-ws'];
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

      if (req.url?.startsWith(wss.options.path)) {
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
