import { DynamicModule, Inject, Module, OnModuleInit, Optional, Provider } from '@nestjs/common';
import { ApolloServer } from 'apollo-server-express';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { HttpAdapterHost } from '@nestjs/core';

import { GraphQLFederationFactory } from './graphql-federation.factory';
import {
  ScalarsExplorerService,
  DelegatesExplorerService,
  ResolversExplorerService,
} from './services';
import { GraphQLAstExplorer } from './graphql-ast.explorer';
import { GraphQLTypesLoader } from './graphql-types.loader';
import { GraphQLSchemaBuilder } from './graphql-schema-builder';
import { GRAPHQL_MODULE_ID, GRAPHQL_MODULE_OPTIONS } from './graphql.constants';
import { GqlModuleAsyncOptions, GqlModuleOptions, GqlOptionsFactory } from './interfaces';
import { generateString, extend, mergeDefaults } from './utils';
import { GraphQLFactory } from './graphql.factory';

@Module({
  providers: [
    GraphQLFederationFactory,
    GraphQLFactory,
    MetadataScanner,
    ResolversExplorerService,
    DelegatesExplorerService,
    ScalarsExplorerService,
    GraphQLAstExplorer,
    GraphQLTypesLoader,
    GraphQLSchemaBuilder,
  ],
  exports: [],
})
export class GraphQLFederationModule implements OnModuleInit {
  private apolloServer: ApolloServer;

  constructor(
    @Optional()
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(GRAPHQL_MODULE_OPTIONS)
    private readonly options: GqlModuleOptions,
    private readonly graphqlFederationFactory: GraphQLFederationFactory,
    private readonly graphqlTypesLoader: GraphQLTypesLoader,
    private readonly graphqlFactory: GraphQLFactory,
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

  private static createAsyncProviders(options: GqlModuleAsyncOptions): Provider[] {
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

  private static createAsyncOptionsProvider(options: GqlModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: GRAPHQL_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: GRAPHQL_MODULE_OPTIONS,
      useFactory: (optionsFactory: GqlOptionsFactory) => optionsFactory.createGqlOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }

  async onModuleInit() {
    const { httpAdapter } = this.httpAdapterHost || {};

    if (!httpAdapter) {
      return;
    }

    const { printSchema } = loadPackage('@apollo/federation', 'ApolloFederation');

    const {
      path,
      disableHealthCheck,
      onHealthCheck,
      cors,
      bodyParserConfig,
      typePaths,
    } = this.options;
    const app = httpAdapter.getInstance();

    const typeDefs = await this.graphqlTypesLoader.getTypesFromPaths(typePaths);

    const mergedTypeDefs = extend(typeDefs, this.options.typeDefs);
    const apolloOptions = await this.graphqlFederationFactory.mergeOptions({
      ...this.options,
      typeDefs: mergedTypeDefs,
    });

    if (this.options.definitions && this.options.definitions.path) {
      await this.graphqlFactory.generateDefinitions(
        printSchema(apolloOptions.schema),
        this.options,
      );
    }

    this.apolloServer = new ApolloServer(apolloOptions as any);
    this.apolloServer.applyMiddleware({
      app,
      path,
      disableHealthCheck,
      onHealthCheck,
      cors,
      bodyParserConfig,
    });

    if (this.options.installSubscriptionHandlers) {
      // TL;DR <https://github.com/apollographql/apollo-server/issues/2776>
      throw new Error('No support for subscriptions yet when using Apollo Federation');
      /*this.apolloServer.installSubscriptionHandlers(
        httpAdapter.getHttpServer(),
      );*/
    }
  }
}
