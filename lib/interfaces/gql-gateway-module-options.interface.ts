import { Type } from '@nestjs/common';
import { Omit, GqlModuleOptions } from './gql-module-options.interface';
import { GatewayConfig, ServiceEndpointDefinition } from '@apollo/gateway';
import { GraphQLDataSource } from '@apollo/gateway/src/datasources/types';
import { ModuleMetadata } from '@nestjs/common/interfaces';

export interface GatewayModuleOptions
  extends Pick<
      GqlModuleOptions,
      | 'path'
      | 'disableHealthCheck'
      | 'onHealthCheck'
      | 'cors'
      | 'bodyParserConfig'
      | 'installSubscriptionHandlers'
    >,
    Omit<GatewayConfig, 'buildService'> {}

export interface GatewayOptionsFactory {
  createGatewayOptions(): Promise<GatewayModuleOptions> | GatewayModuleOptions;
}
export interface GatewayModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<GatewayOptionsFactory>;
  useClass?: Type<GatewayOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<GatewayModuleOptions> | GatewayModuleOptions;
  inject?: any[];
}

export type GatewayBuildService = (definition: ServiceEndpointDefinition) => GraphQLDataSource;
