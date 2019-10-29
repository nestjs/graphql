import { DynamicModule, Inject, Module, OnModuleInit, Optional, Provider } from '@nestjs/common';
import { ApolloServer } from 'apollo-server-express';
import { HttpAdapterHost } from '@nestjs/core';
import {
  GRAPHQL_GATEWAY_BUILD_SERVICE,
  GRAPHQL_GATEWAY_MODULE_OPTIONS,
  GRAPHQL_MODULE_ID,
  GRAPHQL_MODULE_OPTIONS,
} from './graphql.constants';
import {
  GatewayBuildService,
  GatewayModuleOptions,
  GatewayOptionsFactory,
  GatewayModuleAsyncOptions,
} from './interfaces';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { generateString } from './utils';

@Module({})
export class GraphQLGatewayModule implements OnModuleInit {
  private apolloServer: ApolloServer;

  constructor(
    @Optional()
    private readonly httpAdapterHost: HttpAdapterHost,
    @Optional()
    @Inject(GRAPHQL_GATEWAY_BUILD_SERVICE)
    private readonly buildService: GatewayBuildService,
    @Inject(GRAPHQL_GATEWAY_MODULE_OPTIONS)
    private readonly options: GatewayModuleOptions,
  ) {}

  static forRoot(options: GatewayModuleOptions): DynamicModule {
    return {
      module: GraphQLGatewayModule,
      providers: [
        {
          provide: GRAPHQL_GATEWAY_MODULE_OPTIONS,
          useValue: options,
        },
      ],
    };
  }

  static forRootAsync(options: GatewayModuleAsyncOptions): DynamicModule {
    return {
      module: GraphQLGatewayModule,
      imports: options.imports,
      providers: [
        ...this.createAsyncProviders(options),
        {
          provide: GRAPHQL_MODULE_ID,
          useValue: generateString(),
        },
      ],
    };
  }

  private static createAsyncProviders(options: GatewayModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(options: GatewayModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: GRAPHQL_GATEWAY_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: GRAPHQL_GATEWAY_MODULE_OPTIONS,
      useFactory: (optionsFactory: GatewayOptionsFactory) => optionsFactory.createGatewayOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }

  async onModuleInit() {
    const { httpAdapter } = this.httpAdapterHost || {};

    if (!httpAdapter) {
      return;
    }

    const { ApolloGateway } = loadPackage('@apollo/gateway', 'ApolloGateway');
    const app = httpAdapter.getInstance();

    const {
      options: {
        __exposeQueryPlanExperimental,
        debug,
        serviceList,
        path,
        disableHealthCheck,
        onHealthCheck,
        cors,
        bodyParserConfig,
        installSubscriptionHandlers,
      },
      buildService,
    } = this;

    const gateway = new ApolloGateway({
      __exposeQueryPlanExperimental,
      debug,
      serviceList,
      buildService,
    });

    const { schema, executor } = await gateway.load();

    this.apolloServer = new ApolloServer({
      executor,
      schema,
    });

    this.apolloServer.applyMiddleware({
      app,
      path,
      disableHealthCheck,
      onHealthCheck,
      cors,
      bodyParserConfig,
    });

    if (installSubscriptionHandlers) {
      // TL;DR <https://github.com/apollographql/apollo-server/issues/2776>
      throw new Error('No support for subscriptions yet when using Apollo Federation');
      /*this.apolloServer.installSubscriptionHandlers(
        httpAdapter.getHttpServer(),
      );*/
    }
  }
}
