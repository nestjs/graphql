import { MercuriusGatewayOptions } from '@mercuriusjs/gateway';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
} from '@nestjs/graphql';
import { MercuriusCommonOptions } from 'mercurius';
import { MercuriusHooks } from './mercurius-hook.interface.js';
import { MercuriusPlugins } from './mercurius-plugin.interface.js';

export type MercuriusGatewayDriverConfig = Omit<
  GqlModuleOptions,
  'transformSchema'
> & {
  /**
   * Not supported by the `MercuriusGatewayDriver`: the gateway composes its
   * schema from the services at runtime, so setting this option makes the
   * application fail to start. Transform the schemas of the subgraphs instead.
   */
  transformSchema?: GqlModuleOptions['transformSchema'];
} & MercuriusCommonOptions &
  MercuriusGatewayOptions &
  MercuriusPlugins &
  MercuriusHooks;

export type MercuriusGatewayDriverConfigFactory =
  GqlOptionsFactory<MercuriusGatewayDriverConfig>;
export type MercuriusGatewayDriverAsyncConfig =
  GqlModuleAsyncOptions<MercuriusGatewayDriverConfig>;
