import { HttpStatus } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import {
  ApolloError,
  ApolloServerPluginLandingPageGraphQLPlayground,
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} from 'apollo-server-core';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { GqlModuleOptions } from '../interfaces/gql-module-options.interface';

const defaultOptions: GqlModuleOptions = {
  path: '/graphql',
  fieldResolverEnhancers: [],
  stopOnTerminationSignals: false,
};

export function mergeDefaults(
  options: GqlModuleOptions,
  defaults: GqlModuleOptions = defaultOptions,
): GqlModuleOptions {
  if (options.playground !== false && process.env.NODE_ENV === 'production') {
    const playgroundOptions =
      typeof options.playground === 'object' ? options.playground : undefined;
    defaults = {
      ...defaults,
      plugins: [
        ApolloServerPluginLandingPageGraphQLPlayground(playgroundOptions),
      ],
    };
  }
  const moduleOptions = {
    ...defaults,
    ...options,
  };
  wrapContextResolver(moduleOptions, options);
  wrapFormatErrorFn(moduleOptions);
  return moduleOptions;
}

function wrapContextResolver(
  targetOptions: GqlModuleOptions,
  originalOptions: GqlModuleOptions,
) {
  if (!targetOptions.context) {
    targetOptions.context = ({ req, request }) => ({ req: req ?? request });
  } else if (isFunction(targetOptions.context)) {
    targetOptions.context = async (...args: unknown[]) => {
      const ctx = await (originalOptions.context as Function)(...args);
      const { req, request } = args[0] as Record<string, unknown>;
      return assignReqProperty(ctx, req ?? request);
    };
  } else {
    targetOptions.context = ({ req, request }: Record<string, unknown>) => {
      return assignReqProperty(
        originalOptions.context as Record<string, any>,
        req ?? request,
      );
    };
  }
}

function assignReqProperty(
  ctx: Record<string, unknown> | undefined,
  req: unknown,
) {
  if (!ctx) {
    return { req };
  }
  if (
    typeof ctx !== 'object' ||
    (ctx && ctx.req && typeof ctx.req === 'object')
  ) {
    return ctx;
  }
  ctx.req = req;
  return ctx;
}

const apolloPredefinedExceptions: Partial<
  Record<HttpStatus, typeof ApolloError | typeof UserInputError>
> = {
  [HttpStatus.BAD_REQUEST]: UserInputError,
  [HttpStatus.UNAUTHORIZED]: AuthenticationError,
  [HttpStatus.FORBIDDEN]: ForbiddenError,
};

function wrapFormatErrorFn(options: GqlModuleOptions) {
  if (options.autoTransformHttpErrors === false) {
    return;
  }
  if (options.formatError) {
    const origFormatError = options.formatError;
    const transformHttpErrorFn = createTransformHttpErrorFn();
    options.formatError = (err) => {
      err = transformHttpErrorFn(err) as GraphQLError;
      return origFormatError(err);
    };
  } else {
    options.formatError = createTransformHttpErrorFn();
  }
}

function createTransformHttpErrorFn() {
  return (originalError: any): GraphQLFormattedError => {
    const exceptionRef = originalError?.extensions?.exception;
    const isHttpException =
      exceptionRef?.response?.statusCode && exceptionRef?.status;

    if (!isHttpException) {
      return originalError as GraphQLFormattedError;
    }
    let error: ApolloError;

    const httpStatus = exceptionRef?.status;
    if (httpStatus in apolloPredefinedExceptions) {
      error = new apolloPredefinedExceptions[httpStatus](exceptionRef?.message);
    } else {
      error = new ApolloError(exceptionRef.message, httpStatus?.toString());
    }

    error.stack = exceptionRef?.stacktrace;
    error.extensions['response'] = exceptionRef?.response;
    return error;
  };
}
