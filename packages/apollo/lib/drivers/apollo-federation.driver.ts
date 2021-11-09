import { SchemaDirectiveVisitor } from '@graphql-tools/utils';
import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { ModulesContainer } from '@nestjs/core';
import { GraphQLSchemaBuilder } from '@nestjs/graphql-experimental/graphql-schema.builder';
import { GraphQLSchemaHost } from '@nestjs/graphql-experimental/graphql-schema.host';
import {
  ResolversExplorerService,
  ScalarsExplorerService,
} from '@nestjs/graphql-experimental/services';
import { extend } from '@nestjs/graphql-experimental/utils/extend.util';
import { ApolloDriverConfig } from '..';
import { GraphQLFederationFactory } from '../factories/graphql-federation.factory';
import { PluginsExplorerService } from '../services/plugins-explorer.service';
import { ApolloBaseDriver } from './apollo-base.driver';

@Injectable()
export class ApolloFederationDriver extends ApolloBaseDriver {
  private readonly graphqlFederationFactory: GraphQLFederationFactory;

  constructor(
    resolversExplorerService: ResolversExplorerService,
    scalarsExplorerService: ScalarsExplorerService,
    gqlSchemaBuilder: GraphQLSchemaBuilder,
    gqlSchemaHost: GraphQLSchemaHost,
    modulesContainer: ModulesContainer,
  ) {
    super();
    const pluginsExplorerService = new PluginsExplorerService(modulesContainer);
    this.graphqlFederationFactory = new GraphQLFederationFactory(
      resolversExplorerService,
      scalarsExplorerService,
      pluginsExplorerService,
      gqlSchemaBuilder,
      gqlSchemaHost,
    );
  }

  public async start(options: ApolloDriverConfig): Promise<void> {
    const { printSubgraphSchema } = loadPackage(
      '@apollo/subgraph',
      'ApolloFederation',
      () => require('@apollo/subgraph'),
    );
    options = await this.mergeDefaultOptions(options);

    const { typePaths } = options;
    const typeDefs =
      (await this.graphQlTypesLoader.mergeTypesByPaths(typePaths)) || [];

    const mergedTypeDefs = extend(typeDefs, options.typeDefs);
    const adapterOptions = await this.graphqlFederationFactory.mergeOptions({
      ...options,
      typeDefs: mergedTypeDefs,
    });
    await this.runPreOptionsHooks(adapterOptions);

    if (options.definitions && options.definitions.path) {
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

  public async runPreOptionsHooks(apolloOptions: ApolloDriverConfig) {
    await this.runExecutorFactoryIfPresent(apolloOptions);
  }

  protected async registerExpress(apolloOptions: ApolloDriverConfig) {
    return super.registerExpress(apolloOptions, {
      preStartHook: () => {
        // If custom directives are provided merge them into schema per Apollo
        // https://www.apollographql.com/docs/apollo-server/federation/implementing-services/#defining-custom-directives
        if (apolloOptions.schemaDirectives) {
          SchemaDirectiveVisitor.visitSchemaDirectives(
            apolloOptions.schema,
            apolloOptions.schemaDirectives,
          );
        }
      },
    });
  }

  protected async registerFastify(apolloOptions: ApolloDriverConfig) {
    return super.registerFastify(apolloOptions, {
      preStartHook: () => {
        // If custom directives are provided merge them into schema per Apollo
        // https://www.apollographql.com/docs/apollo-server/federation/implementing-services/#defining-custom-directives
        if (apolloOptions.schemaDirectives) {
          SchemaDirectiveVisitor.visitSchemaDirectives(
            apolloOptions.schema,
            apolloOptions.schemaDirectives,
          );
        }
      },
    });
  }

  private async runExecutorFactoryIfPresent(apolloOptions: ApolloDriverConfig) {
    if (!apolloOptions.executorFactory) {
      return;
    }
    const executor = await apolloOptions.executorFactory(apolloOptions.schema);
    apolloOptions.executor = executor;
  }
}
