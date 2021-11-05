import { Inject, Module } from '@nestjs/common';
import {
  DynamicModule,
  OnModuleDestroy,
  OnModuleInit,
  Provider,
} from '@nestjs/common/interfaces';
import { HttpAdapterHost } from '@nestjs/core';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { printSchema } from 'graphql';
import { ApolloGraphQLDriverAdapter } from './adapters/apollo-graphql-driver.adapter';
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
import { extend, generateString, mergeDefaults } from './utils';

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
    ApolloGraphQLDriverAdapter,
  ],
  exports: [GraphQLTypesLoader, GraphQLAstExplorer, GraphQLSchemaHost],
})
export class GraphQLModule implements OnModuleInit, OnModuleDestroy {
  private _subscriptionService?: GraphQLSubscriptionService;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(GRAPHQL_MODULE_OPTIONS) private readonly options: GqlModuleOptions,
    private readonly graphqlFactory: GraphQLFactory,
    private readonly graphqlTypesLoader: GraphQLTypesLoader,
    private readonly graphQlAdapter: ApolloGraphQLDriverAdapter,
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
    const httpAdapter = this.httpAdapterHost?.httpAdapter;
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
    await this.graphQlAdapter.runOptionsHooks(apolloOptions);

    if (this.options.definitions && this.options.definitions.path) {
      await this.graphqlFactory.generateDefinitions(
        printSchema(apolloOptions.schema),
        this.options,
      );
    }

    await this.graphQlAdapter.start(apolloOptions);
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
    await this.graphQlAdapter.stop();
  }
}
