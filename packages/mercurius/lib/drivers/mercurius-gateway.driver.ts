import { AbstractGraphQLDriver } from '@nestjs/graphql';
import { FastifyInstance, FastifyLoggerInstance } from 'fastify';
import { GraphQLSchema } from 'graphql';
import { IncomingMessage, Server, ServerResponse } from 'http';
import mercurius from 'mercurius';
import { MercuriusDriverConfig } from '../interfaces/mercurius-driver-config.interface';
import { registerMercuriusPlugin } from '../utils/register-mercurius-plugin.util';

export class MercuriusGatewayDriver extends AbstractGraphQLDriver<MercuriusDriverConfig> {
  get instance(): FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse,
    FastifyLoggerInstance
  > {
    return this.httpAdapterHost?.httpAdapter?.getInstance?.();
  }

  public async generateSchema(
    options: MercuriusDriverConfig,
  ): Promise<GraphQLSchema> {
    return new GraphQLSchema({});
  }

  public async start(options: MercuriusDriverConfig) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName !== 'fastify') {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }

    const {
      plugins,
      schema: _, // Schema stubbed to be compatible with other drivers, ignore.
      ...mercuriusOptions
    } = options;
    const app = httpAdapter.getInstance<FastifyInstance>();
    await app.register(mercurius, {
      ...mercuriusOptions,
    });
    await registerMercuriusPlugin(app, plugins);
  }

  public async stop(): Promise<void> {}
}
