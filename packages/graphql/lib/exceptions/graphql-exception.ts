import { GraphQLError } from 'graphql';

import type { ExpcetionOptions } from '../interfaces/graphql-exception.interface';

export class GraphQLException extends GraphQLError {
  constructor(message: string, options: ExpcetionOptions) {
    super(message, options);
  }
}
