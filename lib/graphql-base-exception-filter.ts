import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} from 'apollo-server-errors';
import { GqlContextType } from './services';

const apolloPredefinedExceptions: Record<number, typeof ApolloError> = {
  401: AuthenticationError,
  403: ForbiddenError,
};

@Catch(HttpException)
export class GraphQLBaseExceptionFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    if (host.getType<GqlContextType>() !== 'graphql') {
      return null;
    }

    let error: ApolloError;
    if (exception.getStatus() in apolloPredefinedExceptions) {
      error = new apolloPredefinedExceptions[exception.getStatus()](
        exception.message,
      );
    } else {
      error = new ApolloError(
        exception.message,
        exception.getStatus().toString(),
      );
    }

    error.stack = exception.stack;
    error.extensions['response'] = exception.getResponse();

    throw error;
  }
}
