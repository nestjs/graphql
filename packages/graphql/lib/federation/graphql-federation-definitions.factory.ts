import { mergeTypeDefs } from '@graphql-tools/merge';
import { loadPackage } from '@nestjs/common/utils/load-package.util.js';
import { DefinitionNode, DocumentNode, Kind, parse } from 'graphql';
import { gql } from 'graphql-tag';
import { DefinitionsGeneratorOptions } from '../graphql-ast.explorer.js';
import { GraphQLDefinitionsFactory } from '../graphql-definitions.factory.js';
import { extend } from '../utils/index.js';

const DEFAULT_ROOT_TYPE_NAMES: Record<string, string> = {
  query: 'Query',
  mutation: 'Mutation',
  subscription: 'Subscription',
};

/**
 * @publicApi
 */
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

    const {
      buildSubgraphSchema,
      printSubgraphSchema,
    }: typeof import('@apollo/subgraph') = await loadPackage(
      '@apollo/subgraph',
      'ApolloFederation',
      () => import('@apollo/subgraph'),
    );

    const typeDefsDocument = gql`
      ${mergedTypeDefs}
    `;
    const schema = buildSubgraphSchema([
      {
        typeDefs: typeDefsDocument,
        resolvers: {},
      },
    ]);
    const subgraphDocument = this.omitFederationDefinitions(
      parse(printSubgraphSchema(schema)),
      typeDefsDocument,
    );

    // "buildSubgraphSchema" generates an empty Query definition if there is the `extend type Query` statement
    // This leads to duplicated IQuery interfaces
    // see: https://github.com//issues/2344
    const mergedDefinition = mergeTypeDefs([subgraphDocument], {
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

  /**
   * Since v2.15, "printSubgraphSchema" prints the entire subgraph schema, including
   * the types, root fields and schema definition that federation adds on top of
   * the user-provided type definitions. Drop everything the type definitions
   * don't declare themselves so the generated output matches earlier versions.
   */
  private omitFederationDefinitions(
    subgraphDocument: DocumentNode,
    typeDefsDocument: DocumentNode,
  ): DocumentNode {
    const declaredNames = new Set(
      typeDefsDocument.definitions.map((definition) =>
        this.getDefinitionName(definition),
      ),
    );
    const definitions = subgraphDocument.definitions.filter((definition) => {
      if (definition.kind === Kind.SCHEMA_DEFINITION) {
        // Same as "printSchema", omit the schema definition when it only uses the default root type names
        return definition.operationTypes.some(
          ({ operation, type }) =>
            type.name.value !== DEFAULT_ROOT_TYPE_NAMES[operation],
        );
      }
      const name = this.getDefinitionName(definition);
      return (
        !name ||
        definition.kind === Kind.DIRECTIVE_DEFINITION ||
        declaredNames.has(name)
      );
    });
    return { ...subgraphDocument, definitions };
  }

  private getDefinitionName(definition: DefinitionNode): string | undefined {
    return 'name' in definition ? definition.name?.value : undefined;
  }
}
