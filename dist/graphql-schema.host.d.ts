import { GraphQLSchema } from 'graphql';
export declare class GraphQLSchemaHost {
  private _schema;
  set schema(schemaRef: GraphQLSchema);
  get schema(): GraphQLSchema;
}
