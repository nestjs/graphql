import { GatewayConfig, ServiceEndpointDefinition } from '@apollo/gateway';
import { GraphQLDataSource } from '@apollo/gateway/dist/datasources/types';
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
    | 'adapter'
  >;
  adapter?: GqlModuleOptions['adapter'];
}

export interface GatewayOptionsFactory {
  createGatewayOptions():
    | Promise<Omit<GatewayModuleOptions, 'adapter'>>
    | Omit<GatewayModuleOptions, 'adapter'>;
}

export interface GatewayModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  adapter?: GqlModuleOptions['adapter'];
  useExisting?: Type<GatewayOptionsFactory>;
  useClass?: Type<GatewayOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) =>
    | Promise<Omit<GatewayModuleOptions, 'adapter'>>
    | Omit<GatewayModuleOptions, 'adapter'>;
  inject?: any[];
}

export type GatewayBuildService = (
  definition: ServiceEndpointDefinition,
) => GraphQLDataSource;
