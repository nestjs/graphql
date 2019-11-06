import { Injectable } from '@nestjs/common';
import { gql } from 'apollo-server-core';
import { loadPackage } from '@nestjs/common/utils/load-package.util';

import { extend } from './utils';
import {
  ScalarsExplorerService,
  DelegatesExplorerService,
  ResolversExplorerService,
} from './services';
import { GqlModuleOptions } from './interfaces';

@Injectable()
export class GraphQLFederationFactory {
  constructor(
    private readonly resolversExplorerService: ResolversExplorerService,
    private readonly delegatesExplorerService: DelegatesExplorerService,
    private readonly scalarsExplorerService: ScalarsExplorerService,
  ) {}

  private extendResolvers(resolvers: any[]) {
    return resolvers.reduce((prev, curr) => extend(prev, curr), {});
  }

  async mergeOptions(options: GqlModuleOptions = {}): Promise<GqlModuleOptions> {
    const { buildFederatedSchema } = loadPackage('@apollo/federation', 'ApolloFederation');

    const externalResolvers = Array.isArray(options.resolvers)
      ? options.resolvers
      : [options.resolvers];
    const resolvers = this.extendResolvers([
      this.resolversExplorerService.explore(),
      this.delegatesExplorerService.explore(),
      ...this.scalarsExplorerService.explore(),
      ...externalResolvers,
    ]);

    const schema = buildFederatedSchema([
      {
        typeDefs: gql`
          ${options.typeDefs}
        `,
        resolvers,
      },
    ]);

    return {
      ...options,
      schema,
      typeDefs: undefined,
    };
  }
}
