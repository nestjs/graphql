import { ExecutableSchemaTransformation } from '@graphql-tools/schema';
import { IResolverValidationOptions } from '@graphql-tools/utils';
import { ModuleMetadata, Type } from '@nestjs/common';
import {
  ApolloServerPluginLandingPageGraphQLPlaygroundOptions,
  Config,
  GraphQLExecutor,
} from 'apollo-server-core';
import { GraphQLSchema } from 'graphql';
import { ServerOptions } from 'graphql-ws';
import { ServerOptions as SubscriptionTransportWsServerOptions } from 'subscriptions-transport-ws';
import { DefinitionsGeneratorOptions } from '../graphql-ast.explorer';
import { BuildSchemaOptions } from './build-schema-options.interface';

export interface ServerRegistration {
  path?: string;
  cors?: any | boolean;
  bodyParserConfig?: any | boolean;
  onHealthCheck?: (req: any) => Promise<any>;
  disableHealthCheck?: boolean;
}

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export type GraphQLWsSubscriptionsConfig = Partial<
  Pick<
    ServerOptions,
    | 'connectionInitWaitTimeout'
    | 'onConnect'
    | 'onDisconnect'
    | 'onClose'
    | 'onSubscribe'
    | 'onNext'
  >
> & {
  path?: string;
};

export type GraphQLSubscriptionTransportWsConfig = Partial<
  Pick<
    SubscriptionTransportWsServerOptions,
    'onConnect' | 'onDisconnect' | 'keepAlive'
  >
> & {
  path?: string;
};

export type SubscriptionConfig = {
  'graphql-ws'?: GraphQLWsSubscriptionsConfig | boolean;
  'subscriptions-transport-ws'?: GraphQLSubscriptionTransportWsConfig | boolean;
};

export type Enhancer = 'guards' | 'interceptors' | 'filters';
export interface GqlModuleOptions
  extends Omit<Config, 'typeDefs' | 'subscriptions'>,
    Partial<ServerRegistration> {
  typeDefs?: string | string[];
  typePaths?: string[];
  include?: Function[];
  executorFactory?: (
    schema: GraphQLSchema,
  ) => GraphQLExecutor | Promise<GraphQLExecutor>;
  installSubscriptionHandlers?: boolean;
  subscriptions?: SubscriptionConfig;
  resolverValidationOptions?: IResolverValidationOptions;
  directiveResolvers?: any;
  schemaDirectives?: Record<string, any>;
  schemaTransforms?: ExecutableSchemaTransformation[];
  transformSchema?: (
    schema: GraphQLSchema,
  ) => GraphQLSchema | Promise<GraphQLSchema>;
  playground?: boolean | ApolloServerPluginLandingPageGraphQLPlaygroundOptions;
  definitions?: {
    path?: string;
    outputAs?: 'class' | 'interface';
  } & DefinitionsGeneratorOptions;
  autoSchemaFile?: string | boolean;
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
   * Sort the schema lexicographically
   */
  sortSchema?: boolean;
  /**
   * Apply `transformSchema` to the `autoSchemaFile`
   */
  transformAutoSchemaFile?: boolean;
  /**
   * If enabled, will register a global interceptor that automatically maps
   * "HttpException" class instances to corresponding Apollo errors.
   * @default true
   */
  autoTransformHttpErrors?: boolean;
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
