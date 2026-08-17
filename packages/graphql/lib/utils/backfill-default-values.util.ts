import {
  GraphQLArgument,
  GraphQLInputField,
  GraphQLSchema,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
} from 'graphql';

type DefaultValueHolder = (GraphQLArgument | GraphQLInputField) & {
  default?: { value: unknown };
};

/**
 * graphql v17 exposes argument and input field defaults through the new
 * `default` property and deprecates `defaultValue`. Schema elements created by
 * packages that still rely on `defaultValue` (e.g. `@apollo/subgraph`) end up
 * with `default` left undefined, which makes `printSchemaWithDirectives` drop
 * the default from the printed SDL.
 *
 * Backfilling `default` from `defaultValue` keeps those defaults in the SDL. It
 * is a no-op on graphql v16, where `default` does not exist.
 */
export function backfillDefaultValues(schema: GraphQLSchema): GraphQLSchema {
  for (const directive of schema.getDirectives()) {
    directive.args.forEach(backfillDefaultValue);
  }

  for (const type of Object.values(schema.getTypeMap())) {
    if (isObjectType(type) || isInterfaceType(type)) {
      for (const field of Object.values(type.getFields())) {
        field.args.forEach(backfillDefaultValue);
      }
    } else if (isInputObjectType(type)) {
      Object.values(type.getFields()).forEach(backfillDefaultValue);
    }
  }
  return schema;
}

function backfillDefaultValue(element: GraphQLArgument | GraphQLInputField) {
  const holder = element as DefaultValueHolder;
  if (!('default' in holder) || holder.default !== undefined) {
    return;
  }
  if (holder.defaultValue !== undefined) {
    holder.default = { value: holder.defaultValue };
  }
}
