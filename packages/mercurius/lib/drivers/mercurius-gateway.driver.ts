import { AbstractGraphQLDriver } from '@nestjs/graphql-experimental/drivers/abstract-graphql.driver';
import { FastifyInstance, FastifyLoggerInstance } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import mercurius from 'mercurius';
import { MercuriusDriverConfig } from '../interfaces/mercurius-driver-config.interface';

export class MercuriusGatewayDriver extends AbstractGraphQLDriver<
  FastifyInstance,
  MercuriusDriverConfig
> {
  get instance(): FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse,
    FastifyLoggerInstance
  > {
    return this.httpAdapterHost?.httpAdapter?.getInstance?.();
  }

  public async start(mercuriusOptions: MercuriusDriverConfig) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName !== 'fastify') {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }

    const path = this.getNormalizedPath(mercuriusOptions);
    const app = httpAdapter.getInstance<FastifyInstance>();

    await app.register(mercurius, {
      ...mercuriusOptions,
      path,
    });
  }

  public async stop(): Promise<void> {}
}
