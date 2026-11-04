import { isFunction } from '@nestjs/common/utils/shared.utils.js';
import { AbstractGraphQLDriver, GqlModuleOptions } from '@nestjs/graphql';
import { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import mercurius from 'mercurius';

/**
 * The behaviour shared by the Mercurius drivers: per-request context objects
 * and subscription filters.
 */
export abstract class MercuriusBaseDriver<
  T extends Record<string, any> = GqlModuleOptions,
> extends AbstractGraphQLDriver<T> {
  get instance(): FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse,
    FastifyBaseLogger
  > {
    return this.httpAdapterHost?.httpAdapter?.getInstance?.();
  }

  public async stop(): Promise<void> {}

  public async mergeDefaultOptions(options: T): Promise<T> {
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
    targetOptions: GqlModuleOptions,
    originalOptions: GqlModuleOptions = { ...targetOptions },
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
        // (made by "assignReqProperty"; Mercurius then assigns per-request
        // state, e.g. `reply`, onto it)
        return this.assignReqProperty(originalOptions.context, req);
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
    // request, all of them would see the `req` of the first one, and the
    // per-request state Mercurius and Nest assign onto it (`reply`, the
    // context id).
    return ctx.req && typeof ctx.req === 'object'
      ? this.cloneContext(ctx)
      : this.cloneContext(ctx, { req });
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
