import { GraphQLError } from 'graphql';
export declare class SchemaGenerationError extends Error {
  readonly details: ReadonlyArray<GraphQLError>;
  constructor(details: ReadonlyArray<GraphQLError>);
}
