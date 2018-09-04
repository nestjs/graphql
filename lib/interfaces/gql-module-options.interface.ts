import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { Config, ServerRegistration } from 'apollo-server-express';
import { GraphQLSchema } from 'graphql';

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
export interface GqlModuleOptions
  extends Omit<Config, 'typeDefs'>,
    Partial<
      Pick<ServerRegistration, 'onHealthCheck' | 'disableHealthCheck' | 'path'>
    > {
  typeDefs?: string | string[];
  typePaths?: string[];
  include?: Function[];
  installSubscriptionHandlers?: boolean;
  transformSchema?: (
    schema: GraphQLSchema,
  ) => GraphQLSchema | Promise<GraphQLSchema>;
  definitionsOutput?: string;
}

export interface GqlOptionsFactory {
  createGqlOptions(): Promise<GqlModuleOptions> | GqlModuleOptions;
}

export interface GqlModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<GqlOptionsFactory>;
  useClass?: Type<GqlOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<GqlModuleOptions> | GqlModuleOptions;
  inject?: any[];
}
