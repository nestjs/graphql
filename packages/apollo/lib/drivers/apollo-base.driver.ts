//import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { AbstractGraphQLDriver } from '@nestjs/graphql';

/* import {
  ApolloError,
  ApolloServerBase,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
  AuthenticationError,
  ForbiddenError,
  PluginDefinition,
  UserInputError,
} from 'apollo-server-core'; */

import { GraphQLError, GraphQLFormattedError } from 'graphql';
import * as omit from 'lodash.omit';
import { ApolloDriverConfig } from '../interfaces';
import { createAsyncIterator } from '../utils/async-iterator.util';

import { ApolloServerErrorCode } from '@apollo/server/errors';
import { ApolloServer, type BaseContext } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { expressMiddleware } from '@apollo/server/express4';
import * as express from 'express';
import * as http from 'node:http';
import * as cors from 'cors';

import fastifyApollo, {
  fastifyApolloHandler,
  fastifyApolloDrainPlugin,
} from '@as-integrations/fastify';

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
        plugins: [ApolloServerPluginLandingPageLocalDefault(playgroundOptions)],
      };
    } else if (
      (options.playground === undefined &&
        process.env.NODE_ENV === 'production') ||
      options.playground === false
    ) {
      defaults = {
        ...defaults,
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
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

  protected async registerExpress(options: T, hooks?: any) {
    if (hooks?.preStartHook) {
      hooks?.preStartHook();
    }

    const { path, typeDefs, resolvers, schema } = options;

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();
    const httpServer = http.createServer(app);

    // Set up Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      schema,
      ...options,
      /**
       * @TODO
       * should remove serverWillStart from default plugins.
       * after include plugins here
       */
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await server.start();

    app.use(
      path,
      cors(options.cors),
      express.json(),
      expressMiddleware(server),
    );

    this.apolloServer = server;
  }

  protected async registerFastify(options: T, hooks?: any) {
    if (hooks?.preStartHook) {
      hooks?.preStartHook();
    }

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();

    const { path, typeDefs, resolvers, schema } = options;

    const server = new ApolloServer<BaseContext>({
      typeDefs,
      resolvers,
      schema,
      plugins: [fastifyApolloDrainPlugin(app)],
    });

    await server.start();

    app.route({
      url: path,
      method: ['POST', 'OPTIONS'],
      handler: fastifyApolloHandler(server),
    });

    await app.register(fastifyApollo(server));
    await app.register(cors, options.cors);

    this.apolloServer = server;
  }

  private wrapFormatErrorFn(options: T) {
    if (options.autoTransformHttpErrors === false) {
      return;
    }
    if (options.formatError) {
      const origFormatError = options.formatError;
      const transformHttpErrorFn = this.createTransformHttpErrorFn();
      (options as ApolloDriverConfig).formatError = (err) => {
        err = transformHttpErrorFn(err) as GraphQLError;
        return origFormatError(err);
      };
    } else {
      (options as ApolloDriverConfig).formatError =
        this.createTransformHttpErrorFn();
    }
  }

  private createTransformHttpErrorFn() {
    return (originalError: any): GraphQLFormattedError => {
      const exceptionRef = originalError?.extensions?.exception;
      const isHttpException =
        exceptionRef?.response?.statusCode && exceptionRef?.status;

      if (!isHttpException) {
        return originalError as GraphQLFormattedError;
      }
      let error: ApolloServerErrorCode;

      const httpStatus = exceptionRef?.status;
      console.log('httpStatus', httpStatus);
      /* if (httpStatus in apolloPredefinedExceptions) {
        error = new apolloPredefinedExceptions[httpStatus](
          exceptionRef?.message,
        );
      } else {
        error = new ApolloError(exceptionRef.message, httpStatus?.toString());
      }

      error.stack = exceptionRef?.stacktrace;
      error.extensions['response'] = exceptionRef?.response;
      return error; */
    };
  }

  private wrapContextResolver(
    targetOptions: ApolloDriverConfig,
    originalOptions: ApolloDriverConfig = { ...targetOptions },
  ) {
    if (!targetOptions.context) {
      targetOptions.context = ({ req, request }) => ({ req: req ?? request });
    } else if (isFunction(targetOptions.context)) {
      targetOptions.context = async (...args: unknown[]) => {
        const ctx = await (originalOptions.context as Function)(...args);
        const { req, request } = args[0] as Record<string, unknown>;
        return this.assignReqProperty(ctx, req ?? request);
      };
    } else {
      targetOptions.context = ({ req, request }: Record<string, unknown>) => {
        return this.assignReqProperty(
          originalOptions.context as Record<string, any>,
          req ?? request,
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
