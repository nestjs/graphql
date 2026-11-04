import { Injectable } from '@nestjs/common';
import { GraphQLFederationFactory } from '@nestjs/graphql';
import { GraphQLSchema, parse } from 'graphql';
import { MercuriusDriverConfig } from '../interfaces/mercurius-driver-config.interface.js';
import { buildMercuriusFederatedSchema } from '../utils/build-mercurius-federated-schema.util.js';
import { printSubgraphSdl } from '../utils/print-subgraph-sdl.util.js';
import { MercuriusDriver } from './mercurius.driver.js';

/**
 * Registers Mercurius exactly like the `MercuriusDriver` does (the federation
 * plugin only accepts SDL/DocumentNode input, while this driver passes the
 * fully-built GraphQLSchema produced by Nest's federation factory), so it
 * shares its per-request context and subscription filters.
 *
 * @publicApi
 */
@Injectable()
export class MercuriusFederationDriver extends MercuriusDriver {
  constructor(
    private readonly graphqlFederationFactory: GraphQLFederationFactory,
  ) {
    super();
  }

  public async generateSchema(
    options: MercuriusDriverConfig,
  ): Promise<GraphQLSchema> {
    const schema = await this.graphqlFederationFactory.generateSchema(
      this.prepareSchemaOptions(options),
      buildMercuriusFederatedSchema,
    );
    if (!options.autoSchemaFile && options.typeDefs?.length) {
      // Schemas built from type definitions resolve `_service` through "@apollo/subgraph"
      const typeDefs = [options.typeDefs].flat().join('\n');
      const sdl = printSubgraphSdl(parse(typeDefs));
      const serviceField = schema.getQueryType()?.getFields()._service;
      if (serviceField) {
        serviceField.resolve = () => ({ sdl });
      }
    }
    return schema;
  }
}
