import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
} from '@nestjs/graphql';
import { MercuriusCommonOptions } from 'mercurius';
import { MercuriusGatewayOptions } from '@mercuriusjs/gateway';

export type MercuriusGatewayDriverConfig = GqlModuleOptions &
  MercuriusCommonOptions &
  MercuriusGatewayOptions;

export type MercuriusGatewayDriverConfigFactory =
  GqlOptionsFactory<MercuriusGatewayDriverConfig>;
export type MercuriusGatewayDriverAsyncConfig =
  GqlModuleAsyncOptions<MercuriusGatewayDriverConfig>;
