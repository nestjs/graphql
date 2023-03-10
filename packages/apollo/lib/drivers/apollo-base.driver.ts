import { ApolloServer, type BaseContext } from '@apollo/server';
import { ApolloServerPluginLandingPageGraphQLPlayground } from '@apollo/server-plugin-landing-page-graphql-playground';
import {
  ApolloServerErrorCode,
  unwrapResolverError,
} from '@apollo/server/errors';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { HttpStatus } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { AbstractGraphQLDriver } from '@nestjs/graphql';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import * as omit from 'lodash.omit';
import { ApolloDriverConfig } from '../interfaces';
import { createAsyncIterator } from '../utils/async-iterator.util';

const apolloPredefinedExceptions: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.BAD_REQUEST]: ApolloServerErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
};

export abstract class ApolloBaseDriver<
  T extends Record<string, any> = ApolloDriverConfig,
> extends AbstractGraphQLDriver<T> {
  protected apolloServer: ApolloServer<BaseContext>;

  get instance(): ApolloServer<BaseContext> {
    return this.apolloServer;
  }

  public async start(apolloOptions: T) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName === 'express') {
      await this.registerExpress(apolloOptions);
    } else if (platformName === 'fastify') {
      await this.registerFastify(apolloOptions);
    } else {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }
  }

  public stop() {
    return this.apolloServer?.stop();
  }

  public async mergeDefaultOptions(options: T): Promise<T> {
    let defaults: ApolloDriverConfig = {
      path: '/graphql',
      fieldResolverEnhancers: [],
      stopOnTerminationSignals: false,
    };

    if (
      (options.playground === undefined &&
        process.env.NODE_ENV !== 'production') ||
      options.playground
    ) {
      const playgroundOptions =
        typeof options.playground === 'object' ? options.playground : undefined;
      defaults = {
        ...defaults,
        plugins: [
          ApolloServerPluginLandingPageGraphQLPlayground(playgroundOptions),
        ],
      };
    } else if (
      (options.playground === undefined &&
        process.env.NODE_ENV === 'production') ||
      options.playground === false
    ) {
      defaults = {
        ...defaults,
        plugins: [ApolloServerPluginLandingPageDisabled()],
      };
    }

    options = await super.mergeDefaultOptions(
      options,
      omit(defaults, 'plugins'),
    );

    (options as ApolloDriverConfig).plugins = (options.plugins || []).concat(
      defaults.plugins || [],
    );

    this.wrapContextResolver(options);
    this.wrapFormatErrorFn(options);
    return options;
  }

  public subscriptionWithFilter(
    instanceRef: unknown,
    filterFn: (
      payload: any,
      variables: any,
      context: any,
    ) => boolean | Promise<boolean>,
    createSubscribeContext: Function,
  ) {
    return <TPayload, TVariables, TContext, TInfo>(
      ...args: [TPayload, TVariables, TContext, TInfo]
    ): any =>
      createAsyncIterator(createSubscribeContext()(...args), (payload: any) =>
        filterFn.call(instanceRef, payload, ...args.slice(1)),
      );
  }

  protected async registerExpress(
    options: T,
    { preStartHook }: { preStartHook?: () => void } = {},
  ) {
    const { path, typeDefs, resolvers, schema } = options;

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();
    const drainHttpServerPlugin = ApolloServerPluginDrainHttpServer({
      httpServer: httpAdapter.getHttpServer(),
    });

    preStartHook?.();

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      schema,
      ...options,
      plugins: options.plugins
        ? options.plugins.concat([drainHttpServerPlugin])
        : [drainHttpServerPlugin],
    });

    await server.start();

    app.use(
      path,
      expressMiddleware(server, {
        context: options.context,
      }),
    );

    this.apolloServer = server;
  }

  protected async registerFastify(
    options: T,
    { preStartHook }: { preStartHook?: () => void } = {},
  ) {
    const { fastifyApolloDrainPlugin, fastifyApolloHandler } = loadPackage(
      '@as-integrations/fastify',
      'GraphQLModule',
      () => require('@as-integrations/fastify'),
    );

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();

    const { path, typeDefs, resolvers, schema } = options;
    const apolloDrainPlugin = fastifyApolloDrainPlugin(app);

    preStartHook?.();

    const server = new ApolloServer<BaseContext>({
      typeDefs,
      resolvers,
      schema,
      ...options,
      plugins: options.plugins
        ? options.plugins.concat([apolloDrainPlugin])
        : [apolloDrainPlugin],
    });

    await server.start();

    app.route({
      url: path,
      method: ['GET', 'POST', 'OPTIONS'],
      handler: fastifyApolloHandler(server, {
        context: options.context,
      }),
    });

    this.apolloServer = server;
  }

  private wrapFormatErrorFn(options: T) {
    if (options.autoTransformHttpErrors === false) {
      return;
    }
    if (options.formatError) {
      const origFormatError = options.formatError;
      const transformHttpErrorFn = this.createTransformHttpErrorFn();
      (options as ApolloDriverConfig).formatError = (
        formattedError: GraphQLFormattedError,
        err: any,
      ) => {
        err = transformHttpErrorFn(formattedError, err) as GraphQLError;
        return origFormatError(formattedError, err);
      };
    } else {
      (options as ApolloDriverConfig).formatError =
        this.createTransformHttpErrorFn();
    }
  }

  private createTransformHttpErrorFn() {
    return (
      formattedError: GraphQLFormattedError,
      originalError: any,
    ): GraphQLFormattedError => {
      const exceptionRef = unwrapResolverError(originalError) as any;
      const isHttpException =
        exceptionRef?.response?.statusCode && exceptionRef?.status;

      if (!isHttpException) {
        return formattedError;
      }

      let error: GraphQLError;

      const httpStatus = exceptionRef?.status;
      if (httpStatus in apolloPredefinedExceptions) {
        error = new GraphQLError(exceptionRef?.message, {
          path: formattedError.path,
          extensions: {
            ...formattedError.extensions,
            code: apolloPredefinedExceptions[httpStatus],
          },
        });
      } else {
        error = new GraphQLError(exceptionRef.message, {
          path: formattedError.path,
          extensions: {
            ...formattedError.extensions,
            code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
            status: httpStatus,
          },
        });
      }
      if (exceptionRef?.response) {
        error.extensions['originalError'] = exceptionRef.response;
      }
      (error as any).locations = formattedError.locations;
      return error;
    };
  }

  private wrapContextResolver(
    targetOptions: ApolloDriverConfig,
    originalOptions: ApolloDriverConfig = { ...targetOptions },
  ) {
    if (!targetOptions.context) {
      targetOptions.context = async (contextOrRequest) => {
        return {
          // New ApolloServer fastify integration has Request as first parameter to the Context function
          req: contextOrRequest.req ?? contextOrRequest,
        };
      };
    } else if (isFunction(targetOptions.context)) {
      targetOptions.context = async (...args: unknown[]) => {
        const ctx = await (originalOptions.context as Function)(...args);
        const contextOrRequest = args[0] as Record<string, unknown>;
        return this.assignReqProperty(
          ctx,
          contextOrRequest.req ?? contextOrRequest,
        );
      };
    } else {
      targetOptions.context = async (contextOrRequest) => {
        return this.assignReqProperty(
          originalOptions.context as Record<string, any>,
          contextOrRequest.req ?? contextOrRequest,
        );
      };
    }
  }

  private assignReqProperty(
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
}
