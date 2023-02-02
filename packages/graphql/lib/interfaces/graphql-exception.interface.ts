import type {
  GraphQLErrorOptions,
  GraphQLErrorExtensions,
} from 'graphql/error';

export interface ExceptionOptions extends GraphQLErrorOptions {
  extensions: GraphQLErrorExtensions & {
    http: {
      status: number;
    };
  };
}
