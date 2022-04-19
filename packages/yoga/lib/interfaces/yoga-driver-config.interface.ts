import { YogaServerOptions } from '@graphql-yoga/common';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
  SubscriptionConfig,
} from '@nestjs/graphql';

export interface YogaDriverConfig
  extends GqlModuleOptions,
    Omit<YogaServerOptions<{}, {}, {}>, 'context' | 'schema'> {
  /**
   * If enabled, "subscriptions-transport-ws" will be automatically registered.
   */
  installSubscriptionHandlers?: boolean;

  /**
   * Subscriptions configuration.
   */
  subscriptions?: SubscriptionConfig;
}

export type YogaDriverConfigFactory = GqlOptionsFactory<YogaDriverConfig>;
export type YogaDriverAsyncConfig = GqlModuleAsyncOptions<YogaDriverConfig>;
