import { SchemaDirectiveVisitor } from '@graphql-tools/utils';
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
import {
  ApplicationConfig,
  HttpAdapterHost,
  MetadataScanner,
} from '@nestjs/core';
import { ApolloServerBase } from 'apollo-server-core';
import { GraphQLAstExplorer } from '../graphql-ast.explorer';
import { GraphQLSchemaBuilder } from '../graphql-schema.builder';
import { GraphQLSchemaHost } from '../graphql-schema.host';
import { GraphQLTypesLoader } from '../graphql-types.loader';
import {
  GRAPHQL_MODULE_ID,
  GRAPHQL_MODULE_OPTIONS,
} from '../graphql.constants';
import { GraphQLFactory } from '../graphql.factory';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
} from '../interfaces';
import { GraphQLSchemaBuilderModule } from '../schema-builder/schema-builder.module';
import {
  PluginsExplorerService,
  ResolversExplorerService,
  ScalarsExplorerService,
} from '../services';
import {
  extend,
  generateString,
  mergeDefaults,
  normalizeRoutePath,
} from '../utils';
import { GraphQLFederationFactory } from './graphql-federation.factory';

@Module({
  imports: [GraphQLSchemaBuilderModule],
  providers: [
    GraphQLFederationFactory,
    GraphQLFactory,
    MetadataScanner,
    ResolversExplorerService,
    PluginsExplorerService,
    ScalarsExplorerService,
    GraphQLAstExplorer,
    GraphQLTypesLoader,
    GraphQLSchemaBuilder,
    GraphQLSchemaHost,
  ],
  exports: [GraphQLSchemaHost, GraphQLTypesLoader, GraphQLAstExplorer],
})
export class GraphQLFederationModule implements OnModuleInit, OnModuleDestroy {
  private _apolloServer: ApolloServerBase;

  get apolloServer(): ApolloServerBase {
    return this._apolloServer;
  }

  constructor(
    @Optional()
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(GRAPHQL_MODULE_OPTIONS)
    private readonly options: GqlModuleOptions,
    private readonly graphqlFederationFactory: GraphQLFederationFactory,
    private readonly graphqlTypesLoader: GraphQLTypesLoader,
    private readonly graphqlFactory: GraphQLFactory,
    private readonly applicationConfig: ApplicationConfig,
  ) {}

  static forRoot(options: GqlModuleOptions = {}): DynamicModule {
    options = mergeDefaults(options);

    return {
      module: GraphQLFederationModule,
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
      module: GraphQLFederationModule,
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
    if (!this.httpAdapterHost || !this.httpAdapterHost.httpAdapter) {
      return;
    }
    const { printSubgraphSchema } = loadPackage(
      '@apollo/subgraph',
      'ApolloFederation',
      () => require('@apollo/subgraph'),
    );

    const { typePaths } = this.options;
    const typeDefs =
      (await this.graphqlTypesLoader.mergeTypesByPaths(typePaths)) || [];

    const mergedTypeDefs = extend(typeDefs, this.options.typeDefs);
    const apolloOptions = await this.graphqlFederationFactory.mergeOptions({
      ...this.options,
      typeDefs: mergedTypeDefs,
    });
    await this.runExecutorFactoryIfPresent(apolloOptions);

    if (this.options.definitions && this.options.definitions.path) {
      await this.graphqlFactory.generateDefinitions(
        printSubgraphSchema(apolloOptions.schema),
        this.options,
      );
    }

    await this.registerGqlServer(apolloOptions);

    if (
      this.options.installSubscriptionHandlers ||
      this.options.subscriptions
    ) {
      // TL;DR <https://github.com/apollographql/apollo-server/issues/2776>
      throw new Error(
        'No support for subscriptions yet when using Apollo Federation',
      );
    }
  }

  async onModuleDestroy() {
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
    const { disableHealthCheck, onHealthCheck, cors, bodyParserConfig } =
      this.options;
    const app = this.httpAdapterHost.httpAdapter.getInstance();
    const path = this.getNormalizedPath(apolloOptions);

    // If custom directives are provided merge them into schema per Apollo
    // https://www.apollographql.com/docs/apollo-server/federation/implementing-services/#defining-custom-directives
    if (apolloOptions.schemaDirectives) {
      SchemaDirectiveVisitor.visitSchemaDirectives(
        apolloOptions.schema,
        apolloOptions.schemaDirectives,
      );
    }

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

    // If custom directives are provided merge them into schema per Apollo
    // https://www.apollographql.com/docs/apollo-server/federation/implementing-services/#defining-custom-directives
    if (apolloOptions.schemaDirectives) {
      SchemaDirectiveVisitor.visitSchemaDirectives(
        apolloOptions.schema,
        apolloOptions.schemaDirectives,
      );
    }

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
