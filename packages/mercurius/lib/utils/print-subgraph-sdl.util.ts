import { DocumentNode, Kind, print } from 'graphql';

// Provided by the Federation 1 specification, so gateways expect subgraphs to not declare them
const FEDERATION_DIRECTIVE_NAMES = [
  'key',
  'requires',
  'provides',
  'external',
  'extends',
  'tag',
];
const FEDERATION_TYPE_NAMES = ['_FieldSet', '_Any', '_Service', '_Entity'];
const DEFAULT_ROOT_TYPE_NAMES: Record<string, string> = {
  query: 'Query',
  mutation: 'Mutation',
  subscription: 'Subscription',
};

/**
 * Prints the SDL a Federation 1 subgraph exposes through the `_service` field: the
 * type definitions without the definitions provided by the federation specification.
 *
 * "printSubgraphSchema" from "@apollo/subgraph" used to take care of this, but since
 * v2.15 it prints the schema as-is. The `_service` field of "buildSubgraphSchema"
 * also can't be used, as it now adds a stub definition for every type that is only
 * extended, which "@mercuriusjs/gateway" doesn't support.
 */
export function printSubgraphSdl(typeDefs: DocumentNode): string {
  const definitions = typeDefs.definitions.filter((definition) => {
    if (definition.kind === Kind.DIRECTIVE_DEFINITION) {
      return !FEDERATION_DIRECTIVE_NAMES.includes(definition.name.value);
    }
    if (definition.kind === Kind.SCHEMA_DEFINITION) {
      return definition.operationTypes.some(
        ({ operation, type }) =>
          type.name.value !== DEFAULT_ROOT_TYPE_NAMES[operation],
      );
    }
    return !(
      'name' in definition &&
      FEDERATION_TYPE_NAMES.includes(definition.name?.value)
    );
  });
  return print({ ...typeDefs, definitions });
}
