import { GraphQLError } from 'graphql';

export class SchemaGenerationError extends Error {
  constructor(public readonly details: ReadonlyArray<GraphQLError>) {
    super('Schema generation error (code-first approach)');
  }
}
