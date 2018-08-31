import { Inject, Module } from '@nestjs/common';
import {
  DynamicModule,
  HttpServer,
  OnModuleInit,
  Provider,
} from '@nestjs/common/interfaces';
import { HTTP_SERVER_REF } from '@nestjs/core';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { ApolloServer } from 'apollo-server-express';
import { APOLLO_SERVER_REF, GRAPHQL_MODULE_OPTIONS } from './graphql.constants';
import { GraphQLFactory } from './graphql.factory';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
} from './interfaces/gql-module-options.interface';
import { DelegatesExplorerService } from './services/delegates-explorer.service';
import { ResolversExplorerService } from './services/resolvers-explorer.service';
import { ScalarsExplorerService } from './services/scalars-explorer.service';
import { extend } from './utils/extend.util';
import { mergeDefaults } from './utils/merge-defaults.util';

@Module({
  providers: [
    GraphQLFactory,
    MetadataScanner,
    ResolversExplorerService,
    DelegatesExplorerService,
    ScalarsExplorerService,
  ],
  exports: [GraphQLFactory, ResolversExplorerService],
})
export class GraphQLModule implements OnModuleInit {
  constructor(
    @Inject(GRAPHQL_MODULE_OPTIONS) private readonly options: GqlModuleOptions,
    @Inject(HTTP_SERVER_REF) private httpServer: HttpServer,
    @Inject(APOLLO_SERVER_REF) private readonly apolloServer: ApolloServer,
  ) {
    this.init();
  }

  static forRoot(options: GqlModuleOptions = {}): DynamicModule {
    options = mergeDefaults(options);
    return {
      module: GraphQLModule,
      providers: [
        {
          provide: GRAPHQL_MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: APOLLO_SERVER_REF,
          useFactory: (graphQLFactory: GraphQLFactory) => {
            const typeDefs = graphQLFactory.mergeTypesByPaths(
              ...(options.typePaths || []),
            );
            const config = graphQLFactory.mergeOptions({
              ...options,
              typeDefs: extend(typeDefs, options.typeDefs),
            });
            return new ApolloServer(config);
          },
          inject: [GraphQLFactory],
        },
      ],
      exports: [APOLLO_SERVER_REF],
    };
  }

  static forRootAsync(options: GqlModuleAsyncOptions): DynamicModule {
    return {
      module: GraphQLModule,
      imports: options.imports,
      providers: [
        ...this.createAsyncProviders(options),
        {
          provide: APOLLO_SERVER_REF,
          useFactory: async (
            configuration: GqlModuleOptions,
            graphQLFactory: GraphQLFactory,
          ) => {
            const typeDefs = graphQLFactory.mergeTypesByPaths(
              ...(configuration.typePaths || []),
            );
            const config = graphQLFactory.mergeOptions({
              ...configuration,
              typeDefs: extend(typeDefs, configuration.typeDefs),
            });
            return new ApolloServer(config);
          },
          inject: [GRAPHQL_MODULE_OPTIONS, GraphQLFactory],
        },
      ],
      exports: [APOLLO_SERVER_REF],
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
        useFactory: options.useFactory,
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

  init() {
    const { path, disableHealthCheck, onHealthCheck } = this.options;
    const app = this.httpServer.getInstance();

    this.apolloServer.applyMiddleware({
      app,
      path,
      disableHealthCheck,
      onHealthCheck,
    });
  }

  onModuleInit() {
    if (this.options.installSubscriptionHandlers) {
      this.apolloServer.installSubscriptionHandlers(
        this.httpServer.getHttpServer(),
      );
    }
  }
}
