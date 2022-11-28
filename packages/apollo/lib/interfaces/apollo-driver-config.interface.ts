import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
  SubscriptionConfig,
} from '@nestjs/graphql';
import {
  ApolloServerOptions, BaseContext,
} from '@apollo/server';
import { GatewayExecutor } from '@apollo/server-gateway-interface'
import { ApolloServerPluginLandingPageGraphQLPlaygroundOptions } from '@apollo/server-plugin-landing-page-graphql-playground'
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

export interface ApolloDriverConfig
  extends Omit<ApolloServerOptions<BaseContext>, 'typeDefs'>,
    ServerRegistration,
    Omit<GqlModuleOptions, 'resolvers'> {
  /**
   * Executor factory function
   */
  executorFactory?: (
    schema: GraphQLSchema,
  ) => GatewayExecutor | Promise<GatewayExecutor>;

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

export type ApolloDriverConfigFactory = GqlOptionsFactory<ApolloDriverConfig>;
export type ApolloDriverAsyncConfig = GqlModuleAsyncOptions<ApolloDriverConfig>;
