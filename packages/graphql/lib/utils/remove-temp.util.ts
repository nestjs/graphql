import { GraphQLSchema } from 'graphql';

/**
 * Removes "temp__" field from schema added
 * because of "merge-graphql-schemas" library issues.
 **/
export function removeTempField(schema: GraphQLSchema): GraphQLSchema {
  const queryTypeRef = schema.getQueryType();
  if (!queryTypeRef) {
    return schema;
  }
  const fields = queryTypeRef.getFields();
  if (!fields) {
    return schema;
  }
  delete fields['temp__'];
  return schema;
}
