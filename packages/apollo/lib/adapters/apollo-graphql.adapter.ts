import { Injectable } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import {
  GqlSubscriptionService,
  SubscriptionConfig,
} from '@nestjs/graphql-experimental';
import { extend } from '@nestjs/graphql-experimental/utils';
import { printSchema } from 'graphql';
import { ApolloAdapterOptions } from '../interfaces';
import { PluginsExplorerService } from '../services/plugins-explorer.service';
import { ApolloGraphQLBaseAdapter } from './apollo-graphql-base.adapter';

@Injectable()
export class ApolloGraphQLAdapter extends ApolloGraphQLBaseAdapter {
  private _subscriptionService?: GqlSubscriptionService;
  private readonly pluginsExplorerService: PluginsExplorerService;

  constructor(modulesContainer: ModulesContainer) {
    super();
    this.pluginsExplorerService = new PluginsExplorerService(modulesContainer);
  }

  public async start(apolloOptions: ApolloAdapterOptions) {
    const options = await this.mergeDefaultOptions(apolloOptions);
    const typeDefs =
      (await this.graphQlTypesLoader.mergeTypesByPaths(options.typePaths)) ||
      [];

    const mergedTypeDefs = extend(typeDefs, options.typeDefs);

    options.plugins = extend(
      options.plugins || [],
      this.pluginsExplorerService.explore(options),
    );

    const adapterOptions =
      await this.graphQlFactory.mergeOptions<ApolloAdapterOptions>({
        ...options,
        typeDefs: mergedTypeDefs,
      });
    await this.runPreOptionsHooks(adapterOptions);

    if (options.definitions && options.definitions.path) {
      await this.graphQlFactory.generateDefinitions(
        printSchema(adapterOptions.schema),
        options,
      );
    }

    await this.registerServer(adapterOptions);

    if (options.installSubscriptionHandlers || options.subscriptions) {
      const subscriptionsOptions: SubscriptionConfig =
        options.subscriptions || { 'subscriptions-transport-ws': {} };
      this._subscriptionService = new GqlSubscriptionService(
        {
          schema: adapterOptions.schema,
          path: options.path,
          context: options.context,
          ...subscriptionsOptions,
        },
        this.httpAdapterHost.httpAdapter?.getHttpServer(),
      );
    }
  }

  public async registerServer(apolloOptions: ApolloAdapterOptions) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName === 'express') {
      await this.registerExpress(apolloOptions);
    } else if (platformName === 'fastify') {
      await this.registerFastify(apolloOptions);
    } else {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }
  }

  public async stop() {
    await this._subscriptionService?.stop();
    await super.stop();
  }
}
