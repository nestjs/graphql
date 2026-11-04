import { GatewayConfig } from '@apollo/gateway';
import { Type } from '@nestjs/common';
import {
  GqlModuleAsyncOptions,
  GqlOptionsFactory,
  GraphQLDriver,
} from '@nestjs/graphql';
import { GraphQLSchema } from 'graphql';
import { ApolloDriverConfig } from './apollo-driver-config.interface.js';

/**
 *  @publicApi
 */
export interface ApolloGatewayDriverConfig<
  TDriver extends GraphQLDriver = any,
> {
  /**
   * GraphQL gateway adapter
   */
  driver?: Type<TDriver>;
  /**
   * Gateway configuration
   */
  gateway?: GatewayConfig;
  /**
   * Server configuration
   */
  server?: Omit<
    ApolloDriverConfig,
    | 'typeDefs'
    | 'typePaths'
    | 'include'
    | 'resolvers'
    | 'resolverValidationOptions'
    | 'directiveResolvers'
    | 'autoSchemaFile'
    | 'transformSchema'
    | 'definitions'
    | 'schema'
    | 'subscriptions'
    | 'buildSchemaOptions'
    | 'fieldResolverEnhancers'
    | 'driver'
  >;
  /**
   * Function applied to the supergraph schema produced by the gateway
   * before it is exposed to Apollo Server. Use this hook to register
   * custom directive transformers (e.g. `@public`, Apollo Connectors)
   * on the composed schema.
   *
   * Invoked for the initial composition and for every schema update
   * emitted by the gateway after startup (e.g. supergraph polling).
   * While an update is being transformed, or if its transform fails,
   * the previously transformed schema remains in use.
   *
   * The transformed schema is not an access-control boundary: operations
   * are validated (and their root type and variable values checked)
   * against it, but the gateway still plans and executes them against the
   * composed supergraph. Introspection is answered from the untransformed
   * supergraph, and resolvers attached by the transform (e.g. by a
   * directive transformer) are never invoked. Enforce authorization in the
   * subgraphs.
   */
  transformSchema?: (
    schema: GraphQLSchema,
  ) => GraphQLSchema | Promise<GraphQLSchema>;
}

export type ApolloGatewayDriverConfigFactory =
  GqlOptionsFactory<ApolloGatewayDriverConfig>;
export type ApolloGatewayDriverAsyncConfig =
  GqlModuleAsyncOptions<ApolloGatewayDriverConfig>;
