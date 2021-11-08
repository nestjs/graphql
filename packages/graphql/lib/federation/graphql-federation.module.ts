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
import { HttpAdapterHost } from '@nestjs/core';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { AbstractGraphQLAdapter } from '../adapters';
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
import { extend, generateString } from '../utils';
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
export class GraphQLFederationModule<T>
  implements OnModuleInit, OnModuleDestroy
{
  get graphQlAdapter(): AbstractGraphQLAdapter<T> {
    return this._graphQlAdapter;
  }

  constructor(
    @Optional()
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(GRAPHQL_MODULE_OPTIONS)
    private readonly options: GqlModuleOptions,
    private readonly graphqlFederationFactory: GraphQLFederationFactory,
    private readonly graphqlTypesLoader: GraphQLTypesLoader,
    private readonly graphqlFactory: GraphQLFactory,
    private readonly _graphQlAdapter: AbstractGraphQLAdapter<T>,
  ) {}

  static forRoot(options: GqlModuleOptions = {}): DynamicModule {
    return {
      module: GraphQLFederationModule,
      providers: [
        {
          provide: GRAPHQL_MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: AbstractGraphQLAdapter,
          // @todo
          useClass: options.adapter || (AbstractGraphQLAdapter as any),
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
        {
          provide: AbstractGraphQLAdapter,
          // @todo
          useClass: options.adapter || (AbstractGraphQLAdapter as any),
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
        useFactory: async (...args: any[]) => await options.useFactory(...args),
        inject: options.inject || [],
      };
    }

    return {
      provide: GRAPHQL_MODULE_OPTIONS,
      useFactory: async (optionsFactory: GqlOptionsFactory) =>
        await optionsFactory.createGqlOptions(),
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
    const options = await this._graphQlAdapter.mergeDefaultOptions(
      this.options,
    );

    const { typePaths } = options;
    const typeDefs =
      (await this.graphqlTypesLoader.mergeTypesByPaths(typePaths)) || [];

    const mergedTypeDefs = extend(typeDefs, options.typeDefs);
    const adapterOptions = await this.graphqlFederationFactory.mergeOptions({
      ...options,
      typeDefs: mergedTypeDefs,
    });
    await this._graphQlAdapter.runPreOptionsHooks(adapterOptions);

    if (options.definitions && options.definitions.path) {
      await this.graphqlFactory.generateDefinitions(
        printSubgraphSchema(adapterOptions.schema),
        options,
      );
    }

    await this._graphQlAdapter.start(adapterOptions);

    if (options.installSubscriptionHandlers || options.subscriptions) {
      // TL;DR <https://github.com/apollographql/apollo-server/issues/2776>
      throw new Error(
        'No support for subscriptions yet when using Apollo Federation',
      );
    }
  }

  async onModuleDestroy() {
    await this._graphQlAdapter?.stop();
  }
}
