import { ApolloServerOptionsWithTypeDefs } from '@apollo/server';
import { ApolloServerPluginLandingPageLocalDefaultOptions } from '@apollo/server/plugin/landingPage/default';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
  SubscriptionConfig,
} from '@nestjs/graphql';

export interface ServerRegistration {
  /**
   * Path to mount GraphQL API
   */
  path?: string;
}

export interface ApolloDriverConfig
  extends Omit<
      ApolloServerOptionsWithTypeDefs<any>,
      'typeDefs' | 'schema' | 'resolvers' | 'gateway'
    >,
    ServerRegistration,
    GqlModuleOptions {
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
  playground?: boolean | ApolloServerPluginLandingPageLocalDefaultOptions;

  /**
   * If enabled, will register a global interceptor that automatically maps
   * "HttpException" class instances to corresponding Apollo errors.
   * @default true
   */
  autoTransformHttpErrors?: boolean;
}

export type ApolloDriverConfigFactory = GqlOptionsFactory<ApolloDriverConfig>;
export type ApolloDriverAsyncConfig = GqlModuleAsyncOptions<ApolloDriverConfig>;
