import { GraphQLError } from 'graphql';

import type { ExceptionOptions } from '../interfaces/graphql-exception.interface';

export class GraphQLException extends GraphQLError {
  constructor(message: string, options: ExceptionOptions) {
    super(message, options);
  }
}
