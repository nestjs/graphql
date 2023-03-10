import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError, GraphQLErrorOptions } from 'graphql';

/**
 * This error is thrown when the user input is invalid.
 *
 * "UserInputError" class was removed in the latest version of Apollo Server (4.0.0)
 * It was moved to the @nestjs/apollo package to avoid regressions & make migration easier.
 */
export class UserInputError extends GraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: ApolloServerErrorCode.BAD_USER_INPUT,
        ...options?.extensions,
      },
    });
  }
}
