import { Injectable } from '@nestjs/common';
import {
  AbstractGraphQLDriver,
  GraphQLFederationFactory,
} from '@nestjs/graphql';
import { FastifyInstance, FastifyLoggerInstance } from 'fastify';
import { GraphQLSchema, printSchema } from 'graphql';
import { IncomingMessage, Server, ServerResponse } from 'http';
import mercurius from 'mercurius';
import { MercuriusDriverConfig } from '../interfaces/mercurius-driver-config.interface';
import { buildMercuriusFederatedSchema } from '../utils/build-mercurius-federated-schema.util';
import { registerMercuriusPlugin } from '../utils/register-mercurius-plugin.util';

@Injectable()
export class MercuriusFederationDriver extends AbstractGraphQLDriver<MercuriusDriverConfig> {
  constructor(
    private readonly graphqlFederationFactory: GraphQLFederationFactory,
  ) {
    super();
  }

  get instance(): FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse,
    FastifyLoggerInstance
  > {
    return this.httpAdapterHost?.httpAdapter?.getInstance?.();
  }

  public override async generateSchema(
    options: MercuriusDriverConfig,
  ): Promise<GraphQLSchema> {
    return await this.graphqlFederationFactory.generateSchema(
      options,
      buildMercuriusFederatedSchema,
    );
  }

  public async start(options: MercuriusDriverConfig) {
    const { plugins, ...adapterOptions } = options;

    if (adapterOptions.definitions && adapterOptions.definitions.path) {
      await this.graphQlFactory.generateDefinitions(
        printSchema(adapterOptions.schema),
        adapterOptions,
      );
    }

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName !== 'fastify') {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }
    const app = httpAdapter.getInstance<FastifyInstance>();
    await app.register(mercurius, {
      ...adapterOptions,
    });
    await registerMercuriusPlugin(app, plugins);
  }

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  public async stop(): Promise<void> {}
}
