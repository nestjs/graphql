import { GatewayConfig, ServiceEndpointDefinition } from '@apollo/gateway';
import { GraphQLDataSource } from '@apollo/gateway/src/datasources/types';
import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { GqlModuleOptions } from './gql-module-options.interface';

export interface GatewayModuleOptions {
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
  >;
}

export interface GatewayOptionsFactory {
  createGatewayOptions(): Promise<GatewayModuleOptions> | GatewayModuleOptions;
}

export interface GatewayModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<GatewayOptionsFactory>;
  useClass?: Type<GatewayOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<GatewayModuleOptions> | GatewayModuleOptions;
  inject?: any[];
}

export type GatewayBuildService = (
  definition: ServiceEndpointDefinition,
) => GraphQLDataSource;
