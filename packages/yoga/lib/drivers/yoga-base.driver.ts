import { AbstractGraphQLDriver } from '@nestjs/graphql';
import type { FastifyRequest, FastifyReply } from 'fastify';

import { YogaDriverConfig } from '../interfaces';
import { createServer } from '@graphql-yoga/node';
import { useApolloServerErrors } from '@envelop/apollo-server-errors';
import { Logger } from '@nestjs/common';

export abstract class YogaBaseDriver<
  T extends YogaDriverConfig = YogaDriverConfig,
> extends AbstractGraphQLDriver<T> {
  public async start(options: T) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName === 'express') {
      await this.registerExpress(options);
    } else if (platformName === 'fastify') {
      await this.registerFastify(options);
    } else {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }
  }

  /* eslit-disable-next-line @typescript-eslint/no-empty-function */
  public async stop(): Promise<void> {}

  protected async registerExpress(
    options: T,
    { preStartHook }: { preStartHook?: () => void } = {},
  ) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();

    preStartHook?.();

    const graphQLServer = createServer({
      ...options,
      plugins: [...(options.plugins || []), useApolloServerErrors()],
      // disable error masking by default
      maskedErrors: options.maskedErrors ? true : false,
      // disable graphiql in production
      graphiql:
        (options.graphiql === undefined &&
          process.env.NODE_ENV === 'production') ||
        options.graphiql === false
          ? false
          : options.graphiql,
      // disable logging by default, if set to `true`, pass a nestjs Logger or pass custom logger
      logging: !options.logging
        ? false
        : typeof options.logging === 'boolean'
        ? new Logger('YogaDriver')
        : options.logging,
    });

    app.use(options.path || '/graphql', graphQLServer);
  }

  protected async registerFastify(
    options: T,
    { preStartHook }: { preStartHook?: () => void } = {},
  ) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();

    preStartHook?.();

    const graphQLServer = createServer<{
      req: FastifyRequest;
      reply: FastifyReply;
    }>({
      ...options,
      plugins: [...(options.plugins || []), useApolloServerErrors()],
      // disable error masking by default
      maskedErrors: options.maskedErrors ? true : false,
      // disable graphiql in production
      graphiql:
        (options.graphiql === undefined &&
          process.env.NODE_ENV === 'production') ||
        options.graphiql === false
          ? false
          : options.graphiql,
      // disable logging by default, if set to `true`, pass a nestjs Logger or pass custom logger
      logging: !options.logging
        ? false
        : typeof options.logging === 'boolean'
        ? app.log
        : options.logging,
    });

    app.route({
      url: options.path || '/graphql',
      method: ['GET', 'POST', 'OPTIONS'],
      handler: async (req, reply) => {
        const response = await graphQLServer.handleIncomingMessage(req, {
          req,
          reply,
        });
        response.headers.forEach((value, key) => {
          reply.header(key, value);
        });

        reply.status(response.status);

        reply.send(response.body);
      },
    });
  }
}
