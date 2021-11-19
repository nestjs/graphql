import { AbstractGraphQLDriver } from '@nestjs/graphql/drivers/abstract-graphql.driver';
import { FastifyInstance, FastifyLoggerInstance } from 'fastify';
import { printSchema } from 'graphql';
import { IncomingMessage, Server, ServerResponse } from 'http';
import mercurius from 'mercurius';
import { MercuriusDriverConfig } from '../interfaces/mercurius-driver-config.interface';

export class MercuriusDriver extends AbstractGraphQLDriver<
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
    const options =
      await this.graphQlFactory.mergeWithSchema<MercuriusDriverConfig>(
        mercuriusOptions,
      );

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

    const path = this.getNormalizedPath(options);
    const app = httpAdapter.getInstance<FastifyInstance>();

    await app.register(mercurius, {
      ...options,
      path,
      schema: options.schema,
    });
  }

  public async stop(): Promise<void> {}
}
