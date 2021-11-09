import { GatewayConfig } from '@apollo/gateway';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
} from '@nestjs/graphql-experimental';

export interface ApolloGatewayDriverConfig {
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
    | 'driver'
  >;
}

export type ApolloGatewayDriverConfigFactory =
  GqlOptionsFactory<ApolloGatewayDriverConfig>;
export type ApolloGatewayDriverAsyncConfig =
  GqlModuleAsyncOptions<ApolloGatewayDriverConfig>;
