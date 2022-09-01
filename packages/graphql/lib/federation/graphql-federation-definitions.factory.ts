import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { gql } from 'graphql-tag';
import { DefinitionsGeneratorOptions } from '../graphql-ast.explorer';
import { GraphQLDefinitionsFactory } from '../graphql-definitions.factory';
import { extend } from '../utils';
import { mergeTypeDefs } from '@graphql-tools/merge';

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

    // "buildSubgraphSchema" generates an empty Query definition if there is the `extend type Query` statement
    // This leads to duplicated IQuery interfaces
    // see: https://github.com//issues/2344
    const mergedDefinition = mergeTypeDefs([printSubgraphSchema(schema)], {
      useSchemaDefinition: false,
      throwOnConflict: true,
      commentDescriptions: true,
      reverseDirectives: true,
    });

    const tsFile = await this.gqlAstExplorer.explore(
      gql`
        ${mergedDefinition}
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
