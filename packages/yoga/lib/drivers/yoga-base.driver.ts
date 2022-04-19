import { AbstractGraphQLDriver } from '@nestjs/graphql';
import { YogaNodeServerInstance } from '@graphql-yoga/node';
import type { FastifyRequest, FastifyReply } from 'fastify';

import { YogaDriverConfig } from '../interfaces';
import { createServer } from '@graphql-yoga/node';
import { Logger, Options } from '@nestjs/common';

export abstract class YogaBaseDriver<
  T extends YogaDriverConfig = YogaDriverConfig,
> extends AbstractGraphQLDriver<T> {
  protected _server: YogaNodeServerInstance<{}, {}, {}>;

  get instance(): YogaNodeServerInstance<{}, {}, {}> {
    return this._server;
  }

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

  public stop() {
    return Promise.resolve(this._server?.stop());
  }

  protected async registerExpress(
    options: T,
    { preStartHook }: { preStartHook?: () => void } = {},
  ) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();

    preStartHook?.();

    const graphQLServer = createServer({
      ...options,
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

    await graphQLServer.start();

    this._server = graphQLServer;
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
      // disable graphiql in production
      graphiql:
        (options.graphiql === undefined &&
          process.env.NODE_ENV === 'production') ||
        options.graphiql === false
          ? false
          : options.graphiql,
      // disable logging by default, if set to `true`, pass a nestjs Logger or pass custom logger
      logging: app.log,
    });

    app.route({
      url: options.path,
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

    await graphQLServer.start();

    this._server = graphQLServer;
  }
}
