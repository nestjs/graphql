import { ApolloServerOptionsWithTypeDefs } from '@apollo/server';
import { ApolloServerPluginLandingPageGraphQLPlaygroundOptions } from '@apollo/server-plugin-landing-page-graphql-playground';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
  SubscriptionConfig,
} from '@nestjs/graphql';
import { GraphiQLOptions } from '../graphiql/interfaces/graphiql-options.interface';

/**
 *  @publicApi
 */
export interface ServerRegistration {
  /**
   * Path to mount GraphQL API
   */
  path?: string;
}

/**
 *  @publicApi
 */
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
   * The built-in playground is deprecated and will be replaced with GraphiQL in the future.
   */
  playground?: boolean | ApolloServerPluginLandingPageGraphQLPlaygroundOptions;

  /**
   * GraphiQL options, or a boolean to enable GraphiQL with default options.
   */
  graphiql?: boolean | GraphiQLOptions;

  /**
   * If enabled, will register a global interceptor that automatically maps
   * "HttpException" class instances to corresponding Apollo errors.
   * @default true
   */
  autoTransformHttpErrors?: boolean;

  /**
   * Controls whether the Apollo Server plugin that preserves HTTP status codes
   * for execution errors is injected. When enabled, execution errors (errors that
   * occur during resolver execution) will have their HTTP status reset to 200,
   * ensuring the response maintains a stable {data, errors} shape. When disabled,
   * HTTP status codes from extensions.http.status will be preserved in the response.
   * 
   * This flag is independent of autoTransformHttpErrors and provides granular
   * control over HTTP status handling for high-throughput APIs that need to
   * distinguish between execution errors and request-level errors.
   * @default true
   * @see https://github.com/nestjs/graphql/issues/3997
   */
  preserveHttpStatusForExecutionErrors?: boolean;
}

export type ApolloDriverConfigFactory = GqlOptionsFactory<ApolloDriverConfig>;
export type ApolloDriverAsyncConfig = GqlModuleAsyncOptions<ApolloDriverConfig>;
