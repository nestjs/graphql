import { AbstractGraphQLDriver } from '@nestjs/graphql-experimental/drivers/abstract-graphql.driver';
import { extend } from '@nestjs/graphql-experimental/utils';
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
    const options = await this.mergeDefaultOptions(mercuriusOptions);
    const typeDefs =
      (await this.graphQlTypesLoader.mergeTypesByPaths(
        mercuriusOptions.typePaths,
      )) || [];

    const mergedTypeDefs = extend(typeDefs, options.typeDefs);
    const adapterOptions =
      await this.graphQlFactory.mergeOptions<MercuriusDriverConfig>({
        ...options,
        typeDefs: mergedTypeDefs,
      });
    await this.runPreOptionsHooks(adapterOptions);

    if (options.definitions && options.definitions.path) {
      await this.graphQlFactory.generateDefinitions(
        printSchema(adapterOptions.schema),
        options,
      );
    }

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName !== 'fastify') {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }

    const path = this.getNormalizedPath(adapterOptions);
    const app = httpAdapter.getInstance<FastifyInstance>();

    await app.register(mercurius, {
      ...adapterOptions,
      path,
      schema: adapterOptions.schema,
    });
  }

  public async stop(): Promise<void> {}
}
