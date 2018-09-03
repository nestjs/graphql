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
import { GRAPHQL_MODULE_OPTIONS } from './graphql.constants';
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
  protected apolloServer: ApolloServer;
  constructor(
    @Inject(HTTP_SERVER_REF) private httpServer: HttpServer,
    @Inject(GRAPHQL_MODULE_OPTIONS) private readonly options: GqlModuleOptions,
    private readonly graphQLFactory: GraphQLFactory,
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
      providers: [...this.createAsyncProviders(options)],
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

  async onModuleInit() {
    const { path, disableHealthCheck, onHealthCheck } = this.options;
    const app = this.httpServer.getInstance();

    const typeDefs = this.graphQLFactory.mergeTypesByPaths(
      ...(this.options.typePaths || []),
    );
    const apolloOptions = await this.graphQLFactory.mergeOptions({
      ...this.options,
      typeDefs: extend(typeDefs, this.options.typeDefs),
    });

    this.apolloServer = new ApolloServer(apolloOptions as any);
    this.apolloServer.applyMiddleware({
      app,
      path,
      disableHealthCheck,
      onHealthCheck,
    });

    if (this.options.installSubscriptionHandlers) {
      this.apolloServer.installSubscriptionHandlers(
        this.httpServer.getHttpServer(),
      );
    }
  }
}
