import { loadPackage } from '@nestjs/common/utils/load-package.util';
import {
  DefinitionsGeneratorOptions,
  GraphQLDefinitionsFactory,
} from '@nestjs/graphql-experimental';
import { extend } from '@nestjs/graphql-experimental/utils';
import { gql } from 'graphql-tag';

export class GraphQLFederationDefinitionsFactory extends GraphQLDefinitionsFactory {
  protected async exploreAndEmit(
    typePaths: string[],
    path: string,
    outputAs: 'class' | 'interface',
    isDebugEnabled: boolean,
    definitionsGeneratorOptions: DefinitionsGeneratorOptions,
    typeDefs?: string | string[],
  ) {
    const typePathDefs = await this.gqlTypesLoader.mergeTypesByPaths(typePaths);
    const mergedTypeDefs = extend(typePathDefs, typeDefs);

    const { buildSubgraphSchema }: typeof import('@apollo/subgraph') =
      loadPackage('@apollo/subgraph', 'ApolloFederation', () =>
        require('@apollo/subgraph'),
      );

    const { printSubgraphSchema } = loadPackage(
      '@apollo/subgraph',
      'ApolloFederation',
      () => require('@apollo/subgraph'),
    );

    const schema = buildSubgraphSchema([
      {
        typeDefs: gql`
          ${mergedTypeDefs}
        `,
        resolvers: {},
      },
    ]);
    const tsFile = await this.gqlAstExplorer.explore(
      gql`
        ${printSubgraphSchema(schema)}
      `,
      path,
      outputAs,
      definitionsGeneratorOptions,
    );
    await tsFile.save();
    this.printMessage(
      `[${new Date().toLocaleTimeString()}] The definitions have been updated.`,
      isDebugEnabled,
    );
  }
}
