import { Omit, GqlModuleOptions } from './gql-module-options.interface';
import { GatewayConfig, ServiceEndpointDefinition } from '@apollo/gateway';
import { GraphQLDataSource } from '@apollo/gateway/src/datasources/types';

export interface GatewayModuleOptions extends Pick<GqlModuleOptions, 'path' | 'disableHealthCheck' | 'onHealthCheck' | 'cors' | 'bodyParserConfig' | 'installSubscriptionHandlers'>, Omit<GatewayConfig, 'buildService'> {}

export type GatewayBuildService = (definition: ServiceEndpointDefinition) => GraphQLDataSource;
