import { Inject, Logger, Module, RequestMethod } from '@nestjs/common';
import {
  DynamicModule,
  OnModuleDestroy,
  OnModuleInit,
  Provider,
} from '@nestjs/common/interfaces';
import { HttpAdapterHost } from '@nestjs/core';
import { ROUTE_MAPPED_MESSAGE } from '@nestjs/core/helpers/messages';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { AbstractGraphQLDriver } from './drivers/abstract-graphql.driver';
import { GraphQLFederationFactory } from './federation/graphql-federation.factory';
import { TypeDefsDecoratorFactory } from './federation/type-defs-decorator.factory';
import { GraphQLAstExplorer } from './graphql-ast.explorer';
import { GraphQLSchemaBuilder } from './graphql-schema.builder';
import { GraphQLSchemaHost } from './graphql-schema.host';
import { GraphQLTypesLoader } from './graphql-types.loader';
import { GRAPHQL_MODULE_ID, GRAPHQL_MODULE_OPTIONS } from './graphql.constants';
import { GraphQLFactory } from './graphql.factory';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
} from './interfaces/gql-module-options.interface';
import { GraphQLSchemaBuilderModule } from './schema-builder/schema-builder.module';
import { ResolversExplorerService, ScalarsExplorerService } from './services';
import { extend, generateString } from './utils';

@Module({
  imports: [GraphQLSchemaBuilderModule],
  providers: [
    GraphQLFactory,
    MetadataScanner,
    ResolversExplorerService,
    ScalarsExplorerService,
    GraphQLAstExplorer,
    GraphQLTypesLoader,
    GraphQLSchemaBuilder,
    GraphQLSchemaHost,
    GraphQLFederationFactory,
    TypeDefsDecoratorFactory,
  ],
  exports: [
    GraphQLTypesLoader,
    GraphQLAstExplorer,
    GraphQLSchemaHost,
    GraphQLFederationFactory,
  ],
})
export class GraphQLModule<
  TAdapter extends AbstractGraphQLDriver = AbstractGraphQLDriver,
> implements OnModuleInit, OnModuleDestroy
{
  private static readonly logger = new Logger(GraphQLModule.name, {
    timestamp: true,
  });

  get graphQlAdapter(): TAdapter {
    return this._graphQlAdapter as TAdapter;
  }

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(GRAPHQL_MODULE_OPTIONS) private readonly options: GqlModuleOptions,
    private readonly _graphQlAdapter: AbstractGraphQLDriver,
    private readonly graphQlTypesLoader: GraphQLTypesLoader,
  ) {}

  async onModuleDestroy() {
    await this._graphQlAdapter.stop();
  }

  static forRoot<TOptions extends Record<string, any> = GqlModuleOptions>(
    options: TOptions = {} as TOptions,
  ): DynamicModule {
    this.assertDriver(options);

    return {
      module: GraphQLModule,
      providers: [
        {
          provide: GRAPHQL_MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: AbstractGraphQLDriver,
          useClass: options.driver,
        },
      ],
    };
  }

  static forRootAsync<TOptions extends Record<string, any> = GqlModuleOptions>(
    options: GqlModuleAsyncOptions<TOptions, GqlOptionsFactory<TOptions>>,
  ): DynamicModule {
    this.assertDriver(options);
    return {
      module: GraphQLModule,
      imports: options.imports,
      providers: [
        ...this.createAsyncProviders(options),
        {
          provide: GRAPHQL_MODULE_ID,
          useValue: generateString(),
        },
        {
          provide: AbstractGraphQLDriver,
          useClass: options.driver,
        },
      ],
    };
  }

  private static createAsyncProviders<
    TOptions extends Record<string, any> = GqlModuleOptions,
  >(options: GqlModuleAsyncOptions<TOptions>): Provider[] {
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

  private static createAsyncOptionsProvider<
    TOptions extends Record<string, any> = GqlModuleOptions,
  >(options: GqlModuleAsyncOptions<TOptions>): Provider {
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
    const httpAdapter = this.httpAdapterHost?.httpAdapter;
    if (!httpAdapter) {
      return;
    }

    const options = await this._graphQlAdapter.mergeDefaultOptions(
      this.options,
    );
    const { typePaths } = options;
    const typeDefs =
      (await this.graphQlTypesLoader.mergeTypesByPaths(typePaths)) || [];

    const mergedTypeDefs = extend(typeDefs, options.typeDefs);
    await this._graphQlAdapter.start({
      ...options,
      typeDefs: mergedTypeDefs,
    });

    if (options.path) {
      GraphQLModule.logger.log(
        ROUTE_MAPPED_MESSAGE(options.path, RequestMethod.POST),
      );
    }
  }

  private static assertDriver(options: Record<string, any>) {
    if (!options.driver) {
      const errorMessage = `Missing "driver" option. In the latest version of "@nestjs/graphql" package (v10) a new required configuration property called "driver" has been introduced. Check out the official documentation for more details on how to migrate (https://docs.nestjs.com/graphql/migration-guide). Example:

GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
})`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
