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
import { useServer } from 'graphql-ws/lib/use/ws';
import {
  GRAPHQL_WS,
  ServerOptions as SubscriptionTransportWsServerOptions,
  SubscriptionServer,
} from 'subscriptions-transport-ws';
import * as ws from 'ws';

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

export type GraphQLSubscriptionTransportWsConfig = Partial<
  Pick<
    SubscriptionTransportWsServerOptions,
    'onConnect' | 'onDisconnect' | 'onOperation' | 'keepAlive'
  >
> & {
  path?: string;
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
  private readonly wss: ws.Server;
  private readonly subTransWs: ws.Server;
  private wsGqlDisposable: Disposable;
  private subServer: SubscriptionServer;

  constructor(
    private readonly options: GqlSubscriptionServiceOptions,
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
    const { execute = graphqlExecute, subscribe = graphqlSubscribe } =
      this.options;

    if ('graphql-ws' in this.options) {
      const graphqlWsOptions =
        this.options['graphql-ws'] === true ? {} : this.options['graphql-ws'];
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
      const subscriptionsWsOptions =
        this.options['subscriptions-transport-ws'] === true
          ? {}
          : this.options['subscriptions-transport-ws'];

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

      const wss =
        protocols?.includes(GRAPHQL_WS) && // subscriptions-transport-ws subprotocol
        !protocols.includes(GRAPHQL_TRANSPORT_WS_PROTOCOL) // graphql-ws subprotocol
          ? this.subTransWs
          : this.wss;

      if (req.url?.startsWith(wss.options.path)) {
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
