import {
  DynamicModule,
  Inject,
  Module,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
  Provider,
} from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { ApplicationConfig, HttpAdapterHost } from '@nestjs/core';
import { ApolloServerBase } from 'apollo-server-core';
import { GATEWAY_BUILD_SERVICE } from '.';
import { GRAPHQL_MODULE_ID } from '../graphql.constants';
import {
  GatewayBuildService,
  GatewayModuleAsyncOptions,
  GatewayModuleOptions,
  GatewayOptionsFactory,
  GqlModuleOptions,
} from '../interfaces';
import { generateString, normalizeRoutePath } from '../utils';
import { GRAPHQL_GATEWAY_MODULE_OPTIONS } from './federation.constants';

@Module({})
export class GraphQLGatewayModule implements OnModuleInit, OnModuleDestroy {
  private _apolloServer: ApolloServerBase;

  get apolloServer(): ApolloServerBase {
    return this._apolloServer;
  }

  constructor(
    @Optional()
    private readonly httpAdapterHost: HttpAdapterHost,
    @Optional()
    @Inject(GATEWAY_BUILD_SERVICE)
    private readonly buildService: GatewayBuildService,
    @Inject(GRAPHQL_GATEWAY_MODULE_OPTIONS)
    private readonly options: GatewayModuleOptions,
    private readonly applicationConfig: ApplicationConfig,
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

  private static createAsyncProviders(
    options: GatewayModuleAsyncOptions,
  ): Provider[] {
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

  private static createAsyncOptionsProvider(
    options: GatewayModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: GRAPHQL_GATEWAY_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: GRAPHQL_GATEWAY_MODULE_OPTIONS,
      useFactory: (optionsFactory: GatewayOptionsFactory) =>
        optionsFactory.createGatewayOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }

  async onModuleInit() {
    const { httpAdapter } = this.httpAdapterHost || {};
    if (!httpAdapter) {
      return;
    }

    const { ApolloGateway } = loadPackage(
      '@apollo/gateway',
      'ApolloGateway',
      () => require('@apollo/gateway'),
    );
    const {
      options: { server: serverOpts = {}, gateway: gatewayOpts = {} },
      buildService,
    } = this;

    const gateway = new ApolloGateway({
      ...gatewayOpts,
      buildService,
    });

    await this.registerGqlServer({
      ...serverOpts,
      gateway,
      subscriptions: false,
    });

    if (serverOpts.installSubscriptionHandlers) {
      // TL;DR <https://github.com/apollographql/apollo-server/issues/2776>
      throw new Error(
        'No support for subscriptions yet when using Apollo Federation',
      );
      /*this.apolloServer.installSubscriptionHandlers(
        httpAdapter.getHttpServer(),
      );*/
    }
  }

  async onModuleDestroy() {
    await this._apolloServer?.stop();
  }

  private async registerGqlServer(apolloOptions: GqlModuleOptions) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const adapterName = httpAdapter.constructor && httpAdapter.constructor.name;

    if (adapterName === 'ExpressAdapter') {
      this.registerExpress(apolloOptions);
    } else if (adapterName === 'FastifyAdapter') {
      await this.registerFastify(apolloOptions);
    } else {
      throw new Error(`No support for current HttpAdapter: ${adapterName}`);
    }
  }

  private registerExpress(apolloOptions: GqlModuleOptions) {
    const { ApolloServer } = loadPackage(
      'apollo-server-express',
      'GraphQLModule',
      () => require('apollo-server-express'),
    );
    const {
      disableHealthCheck,
      onHealthCheck,
      cors,
      bodyParserConfig,
    } = apolloOptions;
    const app = this.httpAdapterHost.httpAdapter.getInstance();
    const path = this.getNormalizedPath(apolloOptions);

    const apolloServer = new ApolloServer(apolloOptions);
    apolloServer.applyMiddleware({
      app,
      path,
      disableHealthCheck,
      onHealthCheck,
      cors,
      bodyParserConfig,
    });
    this._apolloServer = apolloServer;
  }

  private async registerFastify(apolloOptions: GqlModuleOptions) {
    const { ApolloServer } = loadPackage(
      'apollo-server-fastify',
      'GraphQLModule',
      () => require('apollo-server-fastify'),
    );

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();
    const path = this.getNormalizedPath(apolloOptions);

    const apolloServer = new ApolloServer(apolloOptions);
    const {
      disableHealthCheck,
      onHealthCheck,
      cors,
      bodyParserConfig,
    } = apolloOptions;

    await app.register(
      apolloServer.createHandler({
        disableHealthCheck,
        onHealthCheck,
        cors,
        bodyParserConfig,
        path,
      }),
    );

    this._apolloServer = apolloServer;
  }

  private getNormalizedPath(apolloOptions: GqlModuleOptions): string {
    const prefix = this.applicationConfig.getGlobalPrefix();
    const useGlobalPrefix = prefix && this.options.server?.useGlobalPrefix;
    const gqlOptionsPath = normalizeRoutePath(apolloOptions.path);
    return useGlobalPrefix
      ? normalizeRoutePath(prefix) + gqlOptionsPath
      : gqlOptionsPath;
  }
}
