import { Inject, Module } from '@nestjs/common';
import {
  DynamicModule,
  OnModuleInit,
  Provider,
} from '@nestjs/common/interfaces';
import { HttpAdapterHost } from '@nestjs/core';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { ApolloServer } from 'apollo-server-express';
import { printSchema } from 'graphql';
import { isEmpty } from 'lodash';
import { GraphQLAstExplorer } from './graphql-ast.explorer';
import { GraphQLSchemaBuilder } from './graphql-schema-builder';
import { GraphQLTypesLoader } from './graphql-types.loader';
import { GRAPHQL_MODULE_ID, GRAPHQL_MODULE_OPTIONS } from './graphql.constants';
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
import { generateString } from './utils/generate-token.util';
import { mergeDefaults } from './utils/merge-defaults.util';

@Module({
  providers: [
    GraphQLFactory,
    MetadataScanner,
    ResolversExplorerService,
    DelegatesExplorerService,
    ScalarsExplorerService,
    GraphQLAstExplorer,
    GraphQLTypesLoader,
    GraphQLSchemaBuilder,
  ],
  exports: [GraphQLTypesLoader, GraphQLAstExplorer],
})
export class GraphQLModule implements OnModuleInit {
  protected apolloServer: ApolloServer;
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(GRAPHQL_MODULE_OPTIONS) private readonly options: GqlModuleOptions,
    private readonly graphqlFactory: GraphQLFactory,
    private readonly graphqlTypesLoader: GraphQLTypesLoader,
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
    if (!this.httpAdapterHost) {
      return;
    }
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    if (!httpAdapter) {
      return;
    }
    const {
      path,
      disableHealthCheck,
      onHealthCheck,
      cors,
      bodyParserConfig,
    } = this.options;
    const app = httpAdapter.getInstance();

    const typeDefs = await this.graphqlTypesLoader.mergeTypesByPaths(
      this.options.typePaths,
    );

    const mergedTypeDefs = extend(typeDefs, this.options.typeDefs);
    const apolloOptions = await this.graphqlFactory.mergeOptions({
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
      this.apolloServer.installSubscriptionHandlers(
        httpAdapter.getHttpServer(),
      );
    }
  }
}
