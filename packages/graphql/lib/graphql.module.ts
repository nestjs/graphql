import { Inject, Module } from '@nestjs/common';
import {
  DynamicModule,
  OnModuleDestroy,
  OnModuleInit,
  Provider,
} from '@nestjs/common/interfaces';
import { HttpAdapterHost } from '@nestjs/core';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { AbstractGraphQLAdapter } from '.';
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
import { generateString } from './utils';

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
  ],
  exports: [GraphQLTypesLoader, GraphQLAstExplorer, GraphQLSchemaHost],
})
export class GraphQLModule<TAdapter> implements OnModuleInit, OnModuleDestroy {
  get graphQlAdapter(): AbstractGraphQLAdapter<TAdapter> {
    return this._graphQlAdapter;
  }

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(GRAPHQL_MODULE_OPTIONS) private readonly options: GqlModuleOptions,
    private readonly _graphQlAdapter: AbstractGraphQLAdapter<TAdapter>,
  ) {}

  static forRoot<TOptions extends Record<string, any> = GqlModuleOptions>(
    options: TOptions = {} as TOptions,
  ): DynamicModule {
    return {
      module: GraphQLModule,
      providers: [
        {
          provide: GRAPHQL_MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: AbstractGraphQLAdapter,
          useClass: options.adapter,
        },
      ],
    };
  }

  static forRootAsync<TOptions extends Record<string, any> = GqlModuleOptions>(
    options: GqlModuleAsyncOptions<TOptions, GqlOptionsFactory<TOptions>>,
  ): DynamicModule {
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
          provide: AbstractGraphQLAdapter,
          useClass: options.adapter,
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
    await this._graphQlAdapter.start(this.options);
  }

  async onModuleDestroy() {
    await this._graphQlAdapter.stop();
  }
}
