import { ASTNode, GraphQLError, Source, SourceLocation } from 'graphql';
import { ApolloServerErrorCode } from '@apollo/server/errors';

export class ApolloError extends Error implements GraphQLError {
  locations: readonly SourceLocation[];
  path: readonly (string | number)[];
  nodes: readonly ASTNode[];
  source: Source;
  positions: readonly number[];
  originalError: Error;
  constructor(
    public message: string,
    public extensions: Record<string, any>,
    public code?: string,){
    super(message);

    if (!this.name) {
      Object.defineProperty(this, 'name', { value: 'ApolloError' });
    }

    this.extensions = { ...extensions, code };
  }
}

export class UserInputError extends ApolloError {
  constructor(message: string, extensions?: Record<string, any>) {
    super(message, extensions, ApolloServerErrorCode.BAD_USER_INPUT);

    Object.defineProperty(this, 'name', { value: 'UserInputError' });
  }
}

export class AuthenticationError extends ApolloError {
  constructor(message: string, extensions?: Record<string, any>) {
    super(message, extensions, 'UNAUTHENTICATED');

    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}

export class ForbiddenError extends ApolloError {
  constructor(message: string, extensions?: Record<string, any>) {
    super(message, extensions, 'FORBIDDEN');

    Object.defineProperty(this, 'name', { value: 'ForbiddenError' });
  }
}