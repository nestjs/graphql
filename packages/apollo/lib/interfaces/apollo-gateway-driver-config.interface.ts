import { GatewayConfig } from '@apollo/gateway';
import { Type } from '@nestjs/common';
import {
  GqlModuleAsyncOptions,
  GqlOptionsFactory,
  GraphQLDriver,
} from '@nestjs/graphql';
import { GraphQLSchema } from 'graphql';
import { ApolloDriverConfig } from './apollo-driver-config.interface';

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
   * Invoked once during the initial composition. Schema updates
   * emitted by the gateway after startup (e.g. supergraph polling)
   * are forwarded untransformed because the underlying Apollo Server
   * listener is synchronous.
   */
  transformSchema?: (
    schema: GraphQLSchema,
  ) => GraphQLSchema | Promise<GraphQLSchema>;
}

export type ApolloGatewayDriverConfigFactory =
  GqlOptionsFactory<ApolloGatewayDriverConfig>;
export type ApolloGatewayDriverAsyncConfig =
  GqlModuleAsyncOptions<ApolloGatewayDriverConfig>;
