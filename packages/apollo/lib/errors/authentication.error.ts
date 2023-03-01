import { GraphQLError, GraphQLErrorOptions } from 'graphql';

/**
 * This error is thrown when the user is not authenticated.
 *
 * "AuthenticationError" class was removed in the latest version of Apollo Server (4.0.0)
 * It was moved to the @nestjs/apollo package to avoid regressions & make migration easier.
 */
export class AuthenticationError extends GraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'UNAUTHENTICATED',
        ...options?.extensions,
      },
    });
  }
}
