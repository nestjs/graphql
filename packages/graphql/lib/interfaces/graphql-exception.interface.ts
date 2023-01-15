import type { GraphQLErrorOptions } from 'graphql/error';

export interface ExpcetionOptions extends GraphQLErrorOptions {
  http: {
    status: number;
  };
}
