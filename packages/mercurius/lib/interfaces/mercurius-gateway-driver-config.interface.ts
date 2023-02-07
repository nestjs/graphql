import { MercuriusGatewayOptions } from '@mercuriusjs/gateway';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
} from '@nestjs/graphql';
import { MercuriusCommonOptions } from 'mercurius';
import { MercuriusHooks } from './mercurius-hook.interface';
import { MercuriusPlugins } from './mercurius-plugin.interface';

export type MercuriusGatewayDriverConfig = GqlModuleOptions &
  MercuriusCommonOptions &
  MercuriusGatewayOptions &
  MercuriusPlugins &
  MercuriusHooks;

export type MercuriusGatewayDriverConfigFactory =
  GqlOptionsFactory<MercuriusGatewayDriverConfig>;
export type MercuriusGatewayDriverAsyncConfig =
  GqlModuleAsyncOptions<MercuriusGatewayDriverConfig>;
