import {
  DynamicModule,
  Inject,
  Module,
  OnModuleDestroy,
  OnModuleInit,
  Provider,
} from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { ApplicationConfig, HttpAdapterHost, MetadataScanner } from '@nestjs/core';
import { ApolloServerBase } from 'apollo-server-core';
import { printSchema } from 'graphql';
import { GraphQLAstExplorer } from './graphql-ast.explorer';
import { GraphQLSchemaBuilder } from './graphql-schema.builder';
import { GraphQLSchemaHost } from './graphql-schema.host';
import { GraphQLTypesLoader } from './graphql-types.loader';
import { GraphQLSubscriptionService } from './graphql-ws/graphql-subscription.service';
import { GRAPHQL_MODULE_ID, GRAPHQL_MODULE_OPTIONS } from './graphql.constants';
import { GraphQLFactory } from './graphql.factory';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
  SubscriptionConfig,
} from './interfaces/gql-module-options.interface';
import { GraphQLSchemaBuilderModule } from './schema-builder/schema-builder.module';
import {
  PluginsExplorerService,
  ResolversExplorerService,
  ScalarsExplorerService,
} from './services';
import {
  extend,
  generateString,
  mergeDefaults,
  normalizeRoutePath,
} from './utils';

@Module({
  imports: [GraphQLSchemaBuilderModule],
  providers: [
    GraphQLFactory,
    MetadataScanner,
    ResolversExplorerService,
    ScalarsExplorerService,
    PluginsExplorerService,
    GraphQLAstExplorer,
    GraphQLTypesLoader,
    GraphQLSchemaBuilder,
    GraphQLSchemaHost,
  ],
  exports: [GraphQLTypesLoader, GraphQLAstExplorer, GraphQLSchemaHost],
})
export class GraphQLModule implements OnModuleInit, OnModuleDestroy {
  private _apolloServer: ApolloServerBase;
  private _subscriptionService?: GraphQLSubscriptionService;

  get apolloServer(): ApolloServerBase {
    return this._apolloServer;
  }

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(GRAPHQL_MODULE_OPTIONS) private readonly options: GqlModuleOptions,
    private readonly graphqlFactory: GraphQLFactory,
    private readonly graphqlTypesLoader: GraphQLTypesLoader,
    private readonly applicationConfig: ApplicationConfig,
  ) {}

  static forRoot(options: GqlModuleOptions = {}): DynamicModule {
    options = mergeDefaults(options);
    return {
      module: GraphQLModule,
      providers: [
        {
          provide: GRAPHQL_MODULE_OPTIONS,
          useValue: options,
        },
      ],
    };
  }

  static forRootAsync(options: GqlModuleAsyncOptions): DynamicModule {
    return {
      module: GraphQLModule,
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
    options: GqlModuleAsyncOptions,
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
    options: GqlModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: GRAPHQL_MODULE_OPTIONS,
        useFactory: async (...args: any[]) =>
          mergeDefaults(await options.useFactory(...args)),
        inject: options.inject || [],
      };
    }
    return {
      provide: GRAPHQL_MODULE_OPTIONS,
      useFactory: async (optionsFactory: GqlOptionsFactory) =>
        mergeDefaults(await optionsFactory.createGqlOptions()),
      inject: [options.useExisting || options.useClass],
    };
  }

  async onModuleInit() {
    if (!this.httpAdapterHost) {
      return;
    }
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    if (!httpAdapter) {
      return;
    }
    const typeDefs =
      (await this.graphqlTypesLoader.mergeTypesByPaths(
        this.options.typePaths,
      )) || [];

    const mergedTypeDefs = extend(typeDefs, this.options.typeDefs);
    const apolloOptions = await this.graphqlFactory.mergeOptions({
      ...this.options,
      typeDefs: mergedTypeDefs,
    });
    await this.runExecutorFactoryIfPresent(apolloOptions);

    if (this.options.definitions && this.options.definitions.path) {
      await this.graphqlFactory.generateDefinitions(
        printSchema(apolloOptions.schema),
        this.options,
      );
    }

    await this.registerGqlServer(apolloOptions);
    if (
      this.options.installSubscriptionHandlers ||
      this.options.subscriptions
    ) {
      const subscriptionsOptions: SubscriptionConfig = this.options
        .subscriptions || { 'subscriptions-transport-ws': {} };
      this._subscriptionService = new GraphQLSubscriptionService(
        {
          schema: apolloOptions.schema,
          path: this.options.path,
          context: this.options.context,
          ...subscriptionsOptions,
        },
        httpAdapter.getHttpServer(),
      );
    }
  }

  async onModuleDestroy() {
    await this._subscriptionService?.stop();
    await this._apolloServer?.stop();
  }

  private async registerGqlServer(apolloOptions: GqlModuleOptions) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName === 'express') {
      await this.registerExpress(apolloOptions);
    } else if (platformName === 'fastify') {
      await this.registerFastify(apolloOptions);
    } else {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }
  }

  private async registerExpress(apolloOptions: GqlModuleOptions) {
    const { ApolloServer } = loadPackage(
      'apollo-server-express',
      'GraphQLModule',
      () => require('apollo-server-express'),
    );
    const path = this.getNormalizedPath(apolloOptions);
    const { disableHealthCheck, onHealthCheck, cors, bodyParserConfig } =
      this.options;

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();
    const apolloServer = new ApolloServer(apolloOptions as any);
    await apolloServer.start();

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

    const apolloServer = new ApolloServer(apolloOptions as any);
    await apolloServer.start();
    const { disableHealthCheck, onHealthCheck, cors, bodyParserConfig } =
      this.options;

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
    const useGlobalPrefix = prefix && this.options.useGlobalPrefix;
    const gqlOptionsPath = normalizeRoutePath(apolloOptions.path);
    return useGlobalPrefix
      ? normalizeRoutePath(prefix) + gqlOptionsPath
      : gqlOptionsPath;
  }

  private async runExecutorFactoryIfPresent(apolloOptions: GqlModuleOptions) {
    if (!apolloOptions.executorFactory) {
      return;
    }
    const executor = await apolloOptions.executorFactory(apolloOptions.schema);
    apolloOptions.executor = executor;
  }
}
