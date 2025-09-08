import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { ModulesContainer } from '@nestjs/core';
import {
  extend,
  GqlSubscriptionService,
  GraphQLFederationFactory,
  SubscriptionConfig,
} from '@nestjs/graphql';
import { GraphQLSchema } from 'graphql';
import { ApolloDriverConfig } from '../interfaces';
import { PluginsExplorerService } from '../services/plugins-explorer.service';
import { ApolloBaseDriver } from './apollo-base.driver';

/**
 * @publicApi
 */
@Injectable()
export class ApolloFederationDriver extends ApolloBaseDriver {
  private _subscriptionService?: GqlSubscriptionService;
  private readonly pluginsExplorerService: PluginsExplorerService;

  constructor(
    private readonly graphqlFederationFactory: GraphQLFederationFactory,
    modulesContainer: ModulesContainer,
  ) {
    super();
    this.pluginsExplorerService = new PluginsExplorerService(modulesContainer);
  }

  public async start(options: ApolloDriverConfig): Promise<void> {
    options.plugins = extend(
      options.plugins || [],
      this.pluginsExplorerService.explore(options),
    );

    if (options.definitions && options.definitions.path) {
      const { printSubgraphSchema } = loadPackage(
        '@apollo/subgraph',
        'ApolloFederation',
        () => require('@apollo/subgraph'),
      );
      await this.graphQlFactory.generateDefinitions(
        printSubgraphSchema(options.schema),
        options,
      );
    }

    await super.start(options);

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

  public generateSchema(options: ApolloDriverConfig): Promise<GraphQLSchema> {
    return this.graphqlFederationFactory.generateSchema(options);
  }
}
