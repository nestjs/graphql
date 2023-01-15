import type {
  GraphQLErrorOptions,
  GraphQLErrorExtensions,
} from 'graphql/error';

export interface ExpcetionOptions extends GraphQLErrorOptions {
  extensions: GraphQLErrorExtensions & {
    http: {
      status: number;
    };
  };
}
