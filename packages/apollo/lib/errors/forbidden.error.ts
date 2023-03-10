import { GraphQLError, GraphQLErrorOptions } from 'graphql';

/**
 * This error is thrown when the user is not authorized to access a resource.
 *
 * "ForbiddenError" class was removed in the latest version of Apollo Server (4.0.0)
 * It was moved to the @nestjs/apollo package to avoid regressions & make migration easier.
 */
export class ForbiddenError extends GraphQLError {
  constructor(message: string, options?: GraphQLErrorOptions) {
    super(message, {
      ...options,
      extensions: {
        code: 'FORBIDDEN',
        ...options?.extensions,
      },
    });
  }
}
