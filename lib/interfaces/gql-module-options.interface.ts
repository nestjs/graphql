import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import {
  Config,
  IResolverValidationOptions,
  ServerRegistration,
} from 'apollo-server-express';
import { IDirectiveResolvers, SchemaDirectiveVisitor } from 'graphql-tools';
import { GraphQLSchema, GraphQLResolveInfo } from 'graphql';

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
  directiveResolvers?: IDirectiveResolvers<any, any>;
  schemaDirectives?: {
    [name: string]: typeof SchemaDirectiveVisitor;
  };
  transformSchema?: (
    schema: GraphQLSchema,
  ) => GraphQLSchema | Promise<GraphQLSchema>;
  definitions?: {
    path?: string;
    outputAs?: 'class' | 'interface';
  };
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
