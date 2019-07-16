import { Inject, Module } from '@nestjs/common';
import {
  DynamicModule,
  OnModuleInit,
  Provider,
} from '@nestjs/common/interfaces';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { ApplicationConfig, HttpAdapterHost } from '@nestjs/core';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { ApolloServerBase } from 'apollo-server-core';
import { printSchema } from 'graphql';
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
  protected apolloServer: ApolloServerBase;
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
    const typeDefs =
      (await this.graphqlTypesLoader.mergeTypesByPaths(
        this.options.typePaths,
      )) || [];

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

    this.registerGqlServer(apolloOptions);
    if (this.options.installSubscriptionHandlers) {
      this.apolloServer.installSubscriptionHandlers(
        httpAdapter.getHttpServer(),
      );
    }
  }

  private registerGqlServer(apolloOptions: GqlModuleOptions) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const adapterName = httpAdapter.constructor && httpAdapter.constructor.name;

    if (adapterName === 'ExpressAdapter') {
      this.registerExpress(apolloOptions);
    } else if (adapterName === 'FastifyAdapter') {
      this.registerFastify(apolloOptions);
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
    const prefix = this.applicationConfig.getGlobalPrefix();
    const useGlobalPrefix = prefix && this.options.useGlobalPrefix;
    const path = useGlobalPrefix
      ? prefix + this.options.path
      : this.options.path;

    const {
      disableHealthCheck,
      onHealthCheck,
      cors,
      bodyParserConfig,
    } = this.options;

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();
    const apolloServer = new ApolloServer(apolloOptions as any);

    apolloServer.applyMiddleware({
      app,
      path,
      disableHealthCheck,
      onHealthCheck,
      cors,
      bodyParserConfig,
    });

    this.apolloServer = apolloServer;
  }

  private registerFastify(apolloOptions: GqlModuleOptions) {
    const { ApolloServer } = loadPackage(
      'apollo-server-fastify',
      'GraphQLModule',
      () => require('apollo-server-fastify'),
    );

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();

    const apolloServer = new ApolloServer(apolloOptions as any);
    const {
      disableHealthCheck,
      onHealthCheck,
      cors,
      bodyParserConfig,
    } = this.options;
    app.register(
      apolloServer.createHandler({
        disableHealthCheck,
        onHealthCheck,
        cors,
        bodyParserConfig,
      }),
    );

    this.apolloServer = apolloServer;
  }
}
