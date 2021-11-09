import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
  SubscriptionConfig,
} from '@nestjs/graphql-experimental';
import {
  ApolloServerPluginLandingPageGraphQLPlaygroundOptions,
  Config,
  GraphQLExecutor,
} from 'apollo-server-core';
import { GraphQLSchema } from 'graphql';

export interface ServerRegistration {
  /**
   * Path to mount GraphQL API
   */
  path?: string;

  /**
   * CORS configuration
   */
  cors?: any | boolean;

  /**
   * Body-parser configuration
   */
  bodyParserConfig?: any | boolean;

  /**
   * On health check hook
   */
  onHealthCheck?: (req: any) => Promise<any>;

  /**
   * Whether to enable health check
   */
  disableHealthCheck?: boolean;
}

export interface ApolloAdapterOptions
  extends Omit<Config, 'typeDefs'>,
    ServerRegistration,
    Omit<GqlModuleOptions, 'context'> {
  /**
   * Paths to files that contain GraphQL definitions
   */
  typePaths?: string[];

  /**
   * Executor factory function
   */
  executorFactory?: (
    schema: GraphQLSchema,
  ) => GraphQLExecutor | Promise<GraphQLExecutor>;

  /**
   * If enabled, "subscriptions-transport-ws" will be automatically registered.
   */
  installSubscriptionHandlers?: boolean;

  /**
   * Subscriptions configuration.
   */
  subscriptions?: SubscriptionConfig;

  /**
   * GraphQL playground options.
   */
  playground?: boolean | ApolloServerPluginLandingPageGraphQLPlaygroundOptions;

  /**
   * If enabled, will register a global interceptor that automatically maps
   * "HttpException" class instances to corresponding Apollo errors.
   * @default true
   */
  autoTransformHttpErrors?: boolean;
}

export type ApolloAdapterOptionsFactory =
  GqlOptionsFactory<ApolloAdapterOptions>;
export type ApolloAdapterAsyncOptions =
  GqlModuleAsyncOptions<ApolloAdapterOptions>;
