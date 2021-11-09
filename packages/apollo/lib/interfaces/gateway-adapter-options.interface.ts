import { GatewayConfig } from '@apollo/gateway';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
} from '@nestjs/graphql-experimental';

export interface ApolloGatewayAdapterOptions {
  gateway?: GatewayConfig;
  server?: Omit<
    GqlModuleOptions,
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
    | 'schemaDirectives'
    | 'buildSchemaOptions'
    | 'fieldResolverEnhancers'
    | 'adapter'
  >;
}

export type GatewayOptionsFactory =
  GqlOptionsFactory<ApolloGatewayAdapterOptions>;
export type GatewayAsyncOptions = GqlModuleAsyncOptions<
  ApolloGatewayAdapterOptions,
  GatewayOptionsFactory
>;
