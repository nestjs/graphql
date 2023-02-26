import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
} from '@nestjs/graphql';
import { MercuriusCommonOptions, MercuriusGatewayOptions } from 'mercurius';
import { MercuriusGatewayHooks } from './mercurius-hook.interface';
import { MercuriusPlugin } from './mercurius-plugin.interface';

export type MercuriusGatewayDriverConfig = GqlModuleOptions &
  MercuriusCommonOptions &
  MercuriusGatewayOptions &
  MercuriusPlugin &
  MercuriusGatewayHooks;

export type MercuriusGatewayDriverConfigFactory =
  GqlOptionsFactory<MercuriusGatewayDriverConfig>;
export type MercuriusGatewayDriverAsyncConfig =
  GqlModuleAsyncOptions<MercuriusGatewayDriverConfig>;
