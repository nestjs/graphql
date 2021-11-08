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
import { GATEWAY_BUILD_SERVICE } from '.';
import { AbstractGraphQLAdapter } from '../adapters';
import {
  GRAPHQL_MODULE_ID,
  GRAPHQL_MODULE_OPTIONS,
} from '../graphql.constants';
import {
  GatewayBuildService,
  GatewayModuleAsyncOptions,
  GatewayModuleOptions,
  GatewayOptionsFactory,
} from '../interfaces';
import { generateString } from '../utils';

@Module({})
export class GraphQLGatewayModule<T> implements OnModuleInit, OnModuleDestroy {
  get graphQlAdapter(): AbstractGraphQLAdapter<T> {
    return this._graphQlAdapter;
  }

  constructor(
    @Optional()
    private readonly httpAdapterHost: HttpAdapterHost,
    @Optional()
    @Inject(GATEWAY_BUILD_SERVICE)
    private readonly buildService: GatewayBuildService,
    @Inject(GRAPHQL_MODULE_OPTIONS)
    private readonly options: GatewayModuleOptions,
    private readonly _graphQlAdapter: AbstractGraphQLAdapter<T>,
  ) {}

  static forRoot(options: GatewayModuleOptions): DynamicModule {
    return {
      module: GraphQLGatewayModule,
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

  static forRootAsync(options: GatewayModuleAsyncOptions): DynamicModule {
    return {
      module: GraphQLGatewayModule,
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
    options: GatewayModuleAsyncOptions,
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
    options: GatewayModuleAsyncOptions,
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
      useFactory: (optionsFactory: GatewayOptionsFactory) =>
        optionsFactory.createGatewayOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }

  async onModuleInit() {
    const { httpAdapter } = this.httpAdapterHost || {};
    if (!httpAdapter) {
      return;
    }

    const { ApolloGateway } = loadPackage(
      '@apollo/gateway',
      'ApolloGateway',
      () => require('@apollo/gateway'),
    );
    const {
      options: { server: serverOpts = {}, gateway: gatewayOpts = {} },
      buildService,
    } = this;

    const gateway = new ApolloGateway({
      ...gatewayOpts,
      buildService,
    });

    await this._graphQlAdapter.start({
      ...serverOpts,
      gateway,
      subscriptions: undefined,
    });

    if (serverOpts.installSubscriptionHandlers) {
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
