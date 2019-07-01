import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import {
  Config,
  IResolverValidationOptions,
  ServerRegistration,
} from 'apollo-server-express';
import { GraphQLSchema } from 'graphql';
import { BuildSchemaOptions } from '../external/type-graphql.types';

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
export interface GqlModuleOptions
  extends Omit<Config, 'typeDefs'>,
    Partial<
      Pick<
        ServerRegistration,
        | 'onHealthCheck'
        | 'disableHealthCheck'
        | 'path'
        | 'cors'
        | 'bodyParserConfig'
      >
    > {
  typeDefs?: string | string[];
  typePaths?: string[];
  include?: Function[];
  installSubscriptionHandlers?: boolean;
  resolverValidationOptions?: IResolverValidationOptions;
  directiveResolvers?: any;
  schemaDirectives?: Record<string, any>;
  transformSchema?: (
    schema: GraphQLSchema,
  ) => GraphQLSchema | Promise<GraphQLSchema>;
  definitions?: {
    path?: string;
    outputAs?: 'class' | 'interface';
  };
  autoSchemaFile?: string | boolean;
  buildSchemaOptions?: BuildSchemaOptions;
  /**
   * Prepends the global prefix to the url
   *
   * @see [faq/global-prefix](Global Prefix)
   */
  useGlobalPrefix?: boolean;
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
