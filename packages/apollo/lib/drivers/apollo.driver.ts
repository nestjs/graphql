import { Injectable } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import {
  extend,
  GqlSubscriptionService,
  SubscriptionConfig,
} from '@nestjs/graphql';
import { printSchema } from 'graphql';
import { ApolloDriverConfig } from '../interfaces';
import { PluginsExplorerService } from '../services/plugins-explorer.service';
import { ApolloBaseDriver } from './apollo-base.driver';

/**
 *  @publicApi
 */
@Injectable()
export class ApolloDriver extends ApolloBaseDriver {
  private _subscriptionService?: GqlSubscriptionService;
  private readonly pluginsExplorerService: PluginsExplorerService;

  constructor(modulesContainer: ModulesContainer) {
    super();
    this.pluginsExplorerService = new PluginsExplorerService(modulesContainer);
  }

  public async start(options: ApolloDriverConfig) {
    options.plugins = extend(
      options.plugins || [],
      this.pluginsExplorerService.explore(options),
    );

    if (options.definitions && options.definitions.path) {
      await this.graphQlFactory.generateDefinitions(
        printSchema(options.schema),
        options,
      );
    }

    await this.registerServer(options);

    if (options.installSubscriptionHandlers || options.subscriptions) {
      const subscriptionsOptions: SubscriptionConfig =
        options.subscriptions || { 'subscriptions-transport-ws': {} };
      this._subscriptionService = new GqlSubscriptionService(
        {
          schema: options.schema,
          path: options.path,
          context: options.context,
          ...subscriptionsOptions,
        },
        this.httpAdapterHost.httpAdapter?.getHttpServer(),
      );
    }
  }

  public async registerServer(apolloOptions: ApolloDriverConfig) {
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
