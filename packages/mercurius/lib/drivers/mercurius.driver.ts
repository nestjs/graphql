import { isFunction } from '@nestjs/common/utils/shared.utils';
import { AbstractGraphQLDriver } from '@nestjs/graphql';
import { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { printSchema } from 'graphql';
import { IncomingMessage, Server, ServerResponse } from 'http';
import mercurius from 'mercurius';
import { MercuriusDriverConfig } from '../interfaces/mercurius-driver-config.interface';
import { registerMercuriusHooks } from '../utils/register-mercurius-hooks.util';
import { registerMercuriusPlugin } from '../utils/register-mercurius-plugin.util';

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
        printSchema(options.schema),
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
      (...args: unknown[]) => filterFn.call(instanceRef, ...args),
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
        return this.assignReqProperty(
          originalOptions.context as Record<string, any>,
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
    ctx.req = req;
    return ctx;
  }
}
