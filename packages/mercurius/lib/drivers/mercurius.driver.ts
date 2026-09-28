import { isFunction } from '@nestjs/common/utils/shared.utils.js';
import { AbstractGraphQLDriver } from '@nestjs/graphql';
import { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { GraphQLSchema, printSchema } from 'graphql';
import { IncomingMessage, Server, ServerResponse } from 'http';
import mercurius from 'mercurius';
import { MercuriusDriverConfig } from '../interfaces/mercurius-driver-config.interface.js';
import { registerMercuriusHooks } from '../utils/register-mercurius-hooks.util.js';
import { registerMercuriusRequestHooks } from '../utils/register-mercurius-request-hooks.util.js';
import { registerMercuriusPlugin } from '../utils/register-mercurius-plugin.util.js';

/**
 * @publicApi
 */
export class MercuriusDriver extends AbstractGraphQLDriver<MercuriusDriverConfig> {
  get instance(): FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse,
    FastifyBaseLogger
  > {
    return this.httpAdapterHost?.httpAdapter?.getInstance?.();
  }

  public async start(mercuriusOptions: MercuriusDriverConfig) {
    const { plugins, hooks, ...options } = mercuriusOptions;

    if (options.definitions && options.definitions.path) {
      await this.graphQlFactory.generateDefinitions(
        printSchema(options.schema as GraphQLSchema),
        options,
      );
    }

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName !== 'fastify') {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }
    const app = httpAdapter.getInstance<FastifyInstance>();
    await app.register(mercurius, {
      ...options,
    });
    await registerMercuriusPlugin(app, plugins);
    registerMercuriusHooks(app, hooks);
    registerMercuriusRequestHooks(app, this.resolverDecoratorHost);
  }

  public async stop(): Promise<void> {}

  public async mergeDefaultOptions(
    options: MercuriusDriverConfig,
  ): Promise<MercuriusDriverConfig> {
    options = await super.mergeDefaultOptions(options);
    this.wrapContextResolver(options);
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
    return mercurius.withFilter(
      createSubscribeContext(),
      (payload: any, variables: any, context: any) =>
        filterFn.call(instanceRef, payload, variables, context),
    ) as any;
  }

  private wrapContextResolver(
    targetOptions: MercuriusDriverConfig,
    originalOptions: MercuriusDriverConfig = { ...targetOptions },
  ) {
    if (!targetOptions.context) {
      targetOptions.context = (req: unknown) => ({ req });
    } else if (isFunction(targetOptions.context)) {
      targetOptions.context = async (...args: unknown[]) => {
        const ctx = await (originalOptions.context as Function)(...args);
        const request = args[0] as Record<string, unknown>;
        return this.assignReqProperty(ctx, request);
      };
    } else {
      targetOptions.context = (req: Record<string, unknown>) => {
        // The object is shared by all requests, so each one gets its own copy
        // (Mercurius then assigns per-request state, e.g. `reply`, onto it)
        return this.assignReqProperty(
          this.cloneContext(originalOptions.context),
          req,
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
    // Never assign onto `ctx`: when the same object is returned for every
    // request, all of them would see the `req` of the first one.
    return this.cloneContext(ctx, { req });
  }

  private cloneContext(
    ctx: Record<string, unknown>,
    properties?: Record<string, unknown>,
  ) {
    // Keeps the prototype, and so the methods of class-based contexts
    return Object.assign(
      Object.create(Object.getPrototypeOf(ctx)),
      ctx,
      properties,
    );
  }
}
