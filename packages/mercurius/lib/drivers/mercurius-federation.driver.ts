import { Injectable } from '@nestjs/common';
import {
  AbstractGraphQLDriver,
  GraphQLFederationFactory,
} from '@nestjs/graphql';
import { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { GraphQLSchema, printSchema } from 'graphql';
import { IncomingMessage, Server, ServerResponse } from 'http';
import mercurius from 'mercurius';
import { MercuriusDriverConfig } from '../interfaces/mercurius-driver-config.interface';
import { buildMercuriusFederatedSchema } from '../utils/build-mercurius-federated-schema.util';
import { registerMercuriusHooks } from '../utils/register-mercurius-hooks.util';
import { registerMercuriusPlugin } from '../utils/register-mercurius-plugin.util';
// TODO:
// const { mercuriusFederationPlugin } = require('@mercuriusjs/federation');

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
    FastifyBaseLogger
  > {
    return this.httpAdapterHost?.httpAdapter?.getInstance?.();
  }

  public async start(options: MercuriusDriverConfig) {
    const { plugins, hooks, ...adapterOptions } = options;

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
    // TODO: replace with mercuriusFederationPlugin
    await app.register(mercurius, {
      ...adapterOptions,
    });
    await registerMercuriusPlugin(app, plugins);
    registerMercuriusHooks(app, hooks);
  }

  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  public async stop(): Promise<void> {}

  public generateSchema(
    options: MercuriusDriverConfig,
  ): Promise<GraphQLSchema> {
    return this.graphqlFederationFactory.generateSchema(
      options,
      buildMercuriusFederatedSchema,
    );
  }
}
