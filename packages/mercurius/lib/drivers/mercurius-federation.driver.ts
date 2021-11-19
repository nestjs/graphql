import { Injectable } from '@nestjs/common';
import { AbstractGraphQLDriver } from '@nestjs/graphql/drivers/abstract-graphql.driver';
import { GraphQLFederationFactory } from '@nestjs/graphql/federation/graphql-federation.factory';
import { FastifyInstance, FastifyLoggerInstance } from 'fastify';
import { printSchema } from 'graphql';
import { IncomingMessage, Server, ServerResponse } from 'http';
import mercurius from 'mercurius';
import { MercuriusDriverConfig } from '../interfaces/mercurius-driver-config.interface';

@Injectable()
export class MercuriusFederationDriver extends AbstractGraphQLDriver<
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

  constructor(
    private readonly graphqlFederationFactory: GraphQLFederationFactory,
  ) {
    super();
  }

  public async start(mercuriusOptions: MercuriusDriverConfig) {
    const adapterOptions = await this.graphqlFederationFactory.mergeWithSchema(
      mercuriusOptions,
    );

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
