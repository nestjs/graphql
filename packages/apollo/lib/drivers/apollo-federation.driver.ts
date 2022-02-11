import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { ModulesContainer } from '@nestjs/core';
import { extend, GraphQLFederationFactory } from '@nestjs/graphql';
import { ApolloDriverConfig } from '../interfaces';
import { PluginsExplorerService } from '../services/plugins-explorer.service';
import { ApolloBaseDriver } from './apollo-base.driver';

@Injectable()
export class ApolloFederationDriver extends ApolloBaseDriver {
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

    const adapterOptions = await this.graphqlFederationFactory.mergeWithSchema(
      options,
    );
    await this.runExecutorFactoryIfPresent(adapterOptions);

    if (options.definitions && options.definitions.path) {
      const { printSubgraphSchema } = loadPackage(
        '@apollo/subgraph',
        'ApolloFederation',
        () => require('@apollo/subgraph'),
      );
      await this.graphQlFactory.generateDefinitions(
        printSubgraphSchema(adapterOptions.schema),
        options,
      );
    }

    await super.start(adapterOptions);

    if (options.installSubscriptionHandlers || options.subscriptions) {
      // TL;DR <https://github.com/apollographql/apollo-server/issues/2776>
      throw new Error(
        'No support for subscriptions yet when using Apollo Federation',
      );
    }
  }

  private async runExecutorFactoryIfPresent(apolloOptions: ApolloDriverConfig) {
    if (!apolloOptions.executorFactory) {
      return;
    }
    const executor = await apolloOptions.executorFactory(apolloOptions.schema);
    apolloOptions.executor = executor;
  }
}
