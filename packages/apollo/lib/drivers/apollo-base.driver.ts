import {
  ApolloServer,
  type ApolloServerPlugin,
  type BaseContext,
  HeaderMap,
} from '@apollo/server';
import {
  ApolloServerErrorCode,
  unwrapResolverError,
} from '@apollo/server/errors';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { HttpException, HttpStatus } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util.js';
import { isFunction } from '@nestjs/common/utils/shared.utils.js';
import {
  AbstractGraphQLDriver,
  GraphQLWsSubscriptionsConfig,
  SubscriptionConfig,
} from '@nestjs/graphql';
import {
  DocumentNode,
  GraphQLError,
  GraphQLFormattedError,
  GraphQLSchema,
  specifiedRules,
  validate,
} from 'graphql';
import omit from 'lodash.omit';
import { GraphiQLPlaygroundPlugin } from '../graphiql/graphiql-playground.plugin.js';
import { GraphiQLOptions } from '../graphiql/interfaces/graphiql-options.interface.js';
import { ApolloDriverConfig } from '../interfaces/index.js';
import { createAsyncIterator } from '../utils/async-iterator.util.js';

/**
 * The "graphql-ws" configuration, plus the graphql-ws server options it does
 * not declare but that are forwarded to graphql-ws all the same.
 */
type GraphQLWsServerConfig = GraphQLWsSubscriptionsConfig & {
  validate?: (
    schema: GraphQLSchema,
    document: DocumentNode,
  ) => ReadonlyArray<GraphQLError>;
  onError?: (
    ctx: any,
    id: string,
    payload: any,
    errors: readonly GraphQLError[],
  ) =>
    | Promise<readonly GraphQLFormattedError[] | void>
    | readonly GraphQLFormattedError[]
    | void;
};

const apolloPredefinedExceptions: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.BAD_REQUEST]: ApolloServerErrorCode.BAD_REQUEST,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ApolloServerErrorCode.BAD_USER_INPUT,
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

    // The requests and responses of the Node adapter (@nestjs/platform-node)
    // carry the Express API that the Express integration of Apollo uses
    if (platformName === 'express' || platformName === 'node') {
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

    // `graphiql` wins over the deprecated `playground` alias; when neither is
    // set, GraphiQL is enabled outside of production.
    const useGraphiQL =
      options.graphiql ??
      options.playground ??
      process.env.NODE_ENV !== 'production';

    if (useGraphiQL) {
      const graphiQlPlaygroundOpts: GraphiQLOptions =
        typeof useGraphiQL === 'object' ? { ...useGraphiQL } : {};
      graphiQlPlaygroundOpts.url ??= options.path;

      defaults = {
        ...defaults,
        plugins: [new GraphiQLPlaygroundPlugin(graphiQlPlaygroundOpts)],
      };
    } else {
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

    this.normalizeSubscriptionsPath(options);
    this.wrapContextResolver(options);
    this.wrapFormatErrorFn(options);

    if (options.preserveHttpStatusForExecutionErrors !== false) {
      (options as ApolloDriverConfig).plugins = [
        ...((options as ApolloDriverConfig).plugins || []),
        this.createPreserveHttpStatusPlugin(),
      ];
    }

    (options as ApolloDriverConfig).plugins = [
      ...((options as ApolloDriverConfig).plugins || []),
      this.createRequestLifecycleHooksPlugin(),
    ];
    return options;
  }

  private normalizeSubscriptionsPath(options: T) {
    const subscriptions = (options as ApolloDriverConfig).subscriptions;
    if (!subscriptions) {
      return;
    }
    // Rewrite a copy: the caller's configuration object may be reused across
    // applications, and prefixing it in place compounds on every merge.
    const normalized = { ...subscriptions };
    const config = normalized['graphql-ws'];
    if (config && typeof config === 'object' && config.path) {
      normalized['graphql-ws'] = {
        ...config,
        path: this.applyGlobalPrefix(config.path, options),
      };
    }
    (options as ApolloDriverConfig).subscriptions = normalized;
  }

  /**
   * The subscriptions configuration of the graphql-ws server started next to
   * Apollo Server. graphql-ws executes queries and mutations too, outside of
   * Apollo Server's request pipeline, so the "validationRules" and
   * "formatError" options are applied to its operations here (composed with
   * the hooks of the "graphql-ws" configuration). Apollo Server plugins do
   * not run for operations received over WebSocket.
   */
  protected getSubscriptionConfig(
    options: ApolloDriverConfig,
  ): SubscriptionConfig {
    const subscriptions = options.subscriptions || { 'graphql-ws': {} };
    const config = subscriptions['graphql-ws'];
    if (!config) {
      return subscriptions;
    }
    const graphqlWsConfig: GraphQLWsServerConfig =
      config === true ? {} : config;
    return {
      ...subscriptions,
      'graphql-ws': {
        ...graphqlWsConfig,
        ...this.createGraphQLWsValidation(
          options.validationRules,
          graphqlWsConfig,
        ),
        ...this.createGraphQLWsErrorFormatting(
          options.formatError,
          graphqlWsConfig,
        ),
      } as GraphQLWsSubscriptionsConfig,
    };
  }

  private createGraphQLWsValidation(
    validationRules: ApolloDriverConfig['validationRules'],
    config: GraphQLWsServerConfig,
  ): GraphQLWsServerConfig {
    if (!validationRules?.length || config.validate) {
      return {};
    }
    const { onSubscribe } = config;
    return {
      // Used by graphql-ws for the operations it builds itself
      validate: (schema, document) =>
        validate(schema, document, [...specifiedRules, ...validationRules]),
      // A hook that builds the execution arguments itself skips "validate"
      ...(onSubscribe && {
        onSubscribe: async (...args) => {
          const result = await onSubscribe(...args);
          if (!result || !('document' in result)) {
            return result;
          }
          const errors = validate(
            result.schema,
            result.document,
            validationRules,
          );
          return errors.length > 0 ? errors : result;
        },
      }),
    };
  }

  private createGraphQLWsErrorFormatting(
    formatError: ApolloDriverConfig['formatError'],
    config: GraphQLWsServerConfig,
  ): GraphQLWsServerConfig {
    if (!formatError) {
      return {};
    }
    // Mirrors Apollo Server, which defaults the "code" of every error before
    // handing it to "formatError" (and masks errors thrown by it)
    const formatErrors = (
      errors: readonly GraphQLError[],
      getDefaultCode: (error: GraphQLError) => string,
    ) =>
      errors.map((error) => {
        const formattedError = error.toJSON();
        try {
          return formatError(
            {
              ...formattedError,
              extensions: {
                ...formattedError.extensions,
                code: formattedError.extensions?.code ?? getDefaultCode(error),
              },
            },
            error,
          );
        } catch {
          return {
            message: 'Internal server error',
            extensions: { code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR },
          };
        }
      });

    const { onNext, onError } = config;
    return {
      onNext: async (ctx, id, payload, args, result) => {
        const maybeResult = await onNext?.(ctx, id, payload, args, result);
        if (maybeResult || !result.errors) {
          return maybeResult;
        }
        return {
          ...result,
          errors: formatErrors(
            result.errors,
            () => ApolloServerErrorCode.INTERNAL_SERVER_ERROR,
          ),
        };
      },
      onError: async (ctx, id, payload, errors) => {
        const maybeErrors = await onError?.(ctx, id, payload, errors);
        if (maybeErrors) {
          return maybeErrors;
        }
        // Errors raised before execution (e.g. by validation) have no
        // original error, unlike those thrown by a subscription's iterator
        return formatErrors(errors, (error) =>
          error.originalError
            ? ApolloServerErrorCode.INTERNAL_SERVER_ERROR
            : ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
        );
      },
    };
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
        filterFn.call(instanceRef, payload, args[1], args[2]),
      );
  }

  protected async registerExpress(
    options: T,
    { preStartHook }: { preStartHook?: () => void } = {},
  ) {
    const { expressMiddleware } = await loadPackage(
      '@as-integrations/express5',
      'GraphQLModule',
      () => import('@as-integrations/express5'),
    );

    const { path, typeDefs, resolvers, schema } = options;

    const httpAdapter = this.httpAdapterHost.httpAdapter;

    // Workaround: the landing page requires body to be present
    // otherwise, it shows the "req.body is not set; this probably means you forgot to set up the json middleware before the Apollo Server middleware." error.
    // The latest version of "body-parser" does not set the body if there is no payload.
    // @see https://github.com/nestjs/graphql/issues/3451
    // @see https://github.com/nestjs/nest/pull/14443
    httpAdapter.use(path, (req: any, _: any, next: () => void) => {
      req.body = req.body ?? {};
      next();
    });

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
      plugins: [
        ...(options.plugins ?? []),
        drainHttpServerPlugin,
        this.createRejectSubscriptionsPlugin(),
      ],
    });

    await server.start();

    // Register an exact route, as Nest does for its own routes (and as
    // "registerFastify" does): "app.use(path, ...)" would also serve
    // "/graphql/<anything>", out of reach of the middleware the application
    // binds to "path" with "MiddlewareConsumer#forRoutes({ path, method })".
    app.all(
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
    const { fastifyApolloDrainPlugin, fastifyApolloHandler } =
      await loadPackage(
        '@as-integrations/fastify',
        'GraphQLModule',
        () => import('@as-integrations/fastify'),
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
      plugins: [
        ...(options.plugins ?? []),
        apolloDrainPlugin,
        this.createRejectSubscriptionsPlugin(),
      ],
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

  private createRequestLifecycleHooksPlugin() {
    // Exposes the "request start"/"request end" hooks registered through the
    // `ResolverDecoratorHost` so that consumers can instrument (and measure)
    // the entire lifecycle of a single GraphQL operation.
    const resolverDecoratorHost = () => this.resolverDecoratorHost;

    return {
      async requestDidStart(requestContext: any) {
        const host = resolverDecoratorHost();
        if (!host?.hasRequestHooks()) {
          return;
        }

        const hookContext = {
          query: requestContext.request?.query,
          operationName: requestContext.request?.operationName,
          variables: requestContext.request?.variables,
          context: requestContext.contextValue,
        };
        const state = host.onRequestStart(hookContext);

        return {
          async willSendResponse(endRequestContext: any) {
            const body = endRequestContext.response?.body;
            const errors =
              endRequestContext.errors ??
              (body?.kind === 'single' ? body.singleResult?.errors : undefined);

            host.onRequestEnd({
              ...hookContext,
              operationName:
                endRequestContext.operationName ?? hookContext.operationName,
              errors,
              state,
            });
          },
        };
      },
    };
  }

  private createRejectSubscriptionsPlugin(): ApolloServerPlugin {
    // graphql-js executes a subscription operation it is handed like a query:
    // it calls the "resolve" function of the root field, never "subscribe",
    // which is where Nest runs the guards, interceptors and filters of the
    // handler. Subscriptions are served over WebSocket, so refuse them here.
    // This plugin is registered last and answers through
    // "responseForOperation", so that a plugin serving subscriptions over
    // HTTP itself (e.g. the subscription callback plugin) still answers first.
    return {
      async requestDidStart() {
        return {
          async responseForOperation({ operation }) {
            if (operation?.operation !== 'subscription') {
              return null;
            }
            return {
              http: {
                status: HttpStatus.BAD_REQUEST,
                headers: new HeaderMap(),
              },
              body: {
                kind: 'single',
                singleResult: {
                  errors: [
                    {
                      message:
                        'Subscription operations are not supported over HTTP. Use a WebSocket connection instead.',
                      extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
                    },
                  ],
                },
              },
            };
          },
        };
      },
    };
  }

  private createPreserveHttpStatusPlugin() {
    // When a resolver throws an error whose `extensions.http.status` is set
    // (either directly via GraphQLError or transitively via NestJS HTTP
    // exceptions in user code), Apollo Server uses that value as the HTTP
    // response status. Some GraphQL clients/UIs then refuse to parse the
    // response as a normal `{ data, errors }` payload and instead wrap it as
    // a transport-level error. Reset the HTTP status to 200 once execution
    // has run so the response shape stays stable. Request-level failures
    // (parse, validate) are unaffected because their body has no `data` key.
    // @see https://github.com/nestjs/graphql/issues/2940
    return {
      async requestDidStart() {
        return {
          async willSendResponse(requestContext: any) {
            const body = requestContext.response?.body;
            if (
              body?.kind === 'single' &&
              'data' in (body.singleResult ?? {}) &&
              requestContext.response?.http
            ) {
              requestContext.response.http.status = 200;
            }
          },
        };
      },
    };
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
        formattedError = transformHttpErrorFn(
          formattedError,
          err,
        ) as GraphQLError;
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
      const exceptionRef = unwrapResolverError(originalError);
      // Check the class, not the shape: errors thrown by HTTP clients (e.g.
      // superagent) also have "status" and "response.statusCode", but their
      // "response" holds the outbound request (headers included) and must
      // never be sent to the client.
      if (!(exceptionRef instanceof HttpException)) {
        return formattedError;
      }

      let error: GraphQLError;

      const httpStatus = exceptionRef.getStatus();
      if (httpStatus in apolloPredefinedExceptions) {
        error = new GraphQLError(exceptionRef.message, {
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
      const response = exceptionRef.getResponse();
      if (response) {
        error.extensions['originalError'] = response;
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
        // The object is shared by all requests, so each one gets its own copy
        // (made by "assignReqProperty")
        return this.assignReqProperty(
          originalOptions.context,
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
    if (typeof ctx !== 'object') {
      return ctx;
    }
    // Never hand out `ctx` itself: when the same object is returned for every
    // request, all of them would see the `req` of the first one, and (over
    // graphql-ws, which unlike Apollo Server does not copy the context) the
    // per-request state Nest assigns onto it, e.g. the context id.
    return ctx.req && typeof ctx.req === 'object'
      ? this.cloneContext(ctx)
      : this.cloneContext(ctx, { req });
  }

  private cloneContext(
    ctx: Record<string, unknown>,
    properties?: Record<string, unknown>,
  ) {
    // Keeps the prototype (and so the methods of class-based contexts), just
    // like the copy Apollo Server makes of the context for every operation.
    return Object.assign(
      Object.create(Object.getPrototypeOf(ctx)),
      ctx,
      properties,
    );
  }
}
