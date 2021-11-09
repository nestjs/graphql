import { ExecutableSchemaTransformation } from '@graphql-tools/schema';
import { IResolvers, IResolverValidationOptions } from '@graphql-tools/utils';
import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { GraphQLSchema } from 'graphql';
import { AbstractGraphQLAdapter } from '../adapters/abstract-graphql.adapter';
import { DefinitionsGeneratorOptions } from '../graphql-ast.explorer';
import { BuildSchemaOptions } from './build-schema-options.interface';

export type Enhancer = 'guards' | 'interceptors' | 'filters';

/**
 * "GraphQLModule" options object.
 */
export interface GqlModuleOptions {
  /**
   * Type definitions
   */
  typeDefs?: string | string[];

  /**
   * GraphQL server adapter
   */
  adapter?: Type<AbstractGraphQLAdapter>;

  /**
   * An array of modules to scan when searching for resolvers
   */
  include?: Function[];

  /**
   * Schema directives mapping
   */
  schemaDirectives?: Record<string, any>;

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
   * An array of executable schema transformations
   */
  schemaTransforms?: ExecutableSchemaTransformation[];

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
  createGqlOptions(): Promise<Omit<T, 'adapter'>> | Omit<T, 'adapter'>;
}

export interface GqlModuleAsyncOptions<
  TOptions extends Record<string, any> = GqlModuleOptions,
  TFactory = GqlOptionsFactory,
> extends Pick<ModuleMetadata, 'imports'> {
  /**
   * GraphQL server adapter
   */
  adapter?: TOptions['adapter'];
  useExisting?: Type<TFactory>;
  useClass?: Type<TFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<Omit<TOptions, 'adapter'>> | Omit<TOptions, 'adapter'>;
  inject?: any[];
}
