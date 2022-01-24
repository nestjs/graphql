import { IResolvers, IResolverValidationOptions } from '@graphql-tools/utils';
import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { GraphQLSchema } from 'graphql';
import { GraphQLDriver } from '.';
import { DefinitionsGeneratorOptions } from '../graphql-ast.explorer';
import { BuildSchemaOptions } from './build-schema-options.interface';

export type Enhancer = 'guards' | 'interceptors' | 'filters';

/**
 * "GraphQLModule" options object.
 */
export interface GqlModuleOptions<TDriver extends GraphQLDriver = any> {
  /**
   * Type definitions
   */
  typeDefs?: string | string[];

  /**
   * Paths to files that contain GraphQL definitions
   */
  typePaths?: string[];

  /**
   * GraphQL server adapter
   */
  driver?: Type<TDriver>;

  /**
   * An array of modules to scan when searching for resolvers
   */
  include?: Function[];

  /**
   * Directive resolvers
   */
  directiveResolvers?: any;

  /**
   * Optional GraphQL schema (to be used or to be merged)
   */
  schema?: GraphQLSchema;

  /**
   * Extra resolvers to be registered.
   */
  resolvers?: IResolvers | Array<IResolvers>;

  /**
   * TypeScript definitions generator options
   */
  definitions?: {
    path?: string;
    outputAs?: 'class' | 'interface';
  } & DefinitionsGeneratorOptions;

  /**
   * If enabled, GraphQL schema will be generated automatically
   */
  autoSchemaFile?: string | boolean;

  /**
   * Sort the schema lexicographically
   */
  sortSchema?: boolean;

  /**
   * Options to be passed to the schema generator
   * Only applicable if "autoSchemaFile" = true
   */
  buildSchemaOptions?: BuildSchemaOptions;

  /**
   * Prepends the global prefix to the url
   *
   * @see [faq/global-prefix](Global Prefix)
   */
  useGlobalPrefix?: boolean;

  /**
   * Enable/disable enhancers for @ResolveField()
   */
  fieldResolverEnhancers?: Enhancer[];

  /**
   * Resolver validation options.
   */
  resolverValidationOptions?: IResolverValidationOptions;

  /**
   * Function to be applied to the schema letting you register custom transformations.
   */
  transformSchema?: (
    schema: GraphQLSchema,
  ) => GraphQLSchema | Promise<GraphQLSchema>;

  /**
   * Apply `transformSchema` to the `autoSchemaFile`
   */
  transformAutoSchemaFile?: boolean;

  /**
   * Context function
   */
  context?: any;
}

export interface GqlOptionsFactory<
  T extends Record<string, any> = GqlModuleOptions,
> {
  createGqlOptions(): Promise<Omit<T, 'driver'>> | Omit<T, 'driver'>;
}

export interface GqlModuleAsyncOptions<
  TOptions extends Record<string, any> = GqlModuleOptions,
  TFactory = GqlOptionsFactory<TOptions>,
> extends Pick<ModuleMetadata, 'imports'> {
  /**
   * GraphQL server driver
   */
  driver?: TOptions['driver'];
  useExisting?: Type<TFactory>;
  useClass?: Type<TFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<Omit<TOptions, 'driver'>> | Omit<TOptions, 'driver'>;
  inject?: any[];
}
