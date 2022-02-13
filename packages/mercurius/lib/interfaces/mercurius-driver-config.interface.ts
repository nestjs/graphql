import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
} from '@nestjs/graphql';
import { MercuriusOptions } from 'mercurius';
import { MercuriusDriverPlugin } from './mercurius-driver-plugin.interface';

interface MercuriusPlugins {
  plugins?: MercuriusDriverPlugin[];
}

export type MercuriusDriverConfig = GqlModuleOptions &
  MercuriusOptions &
  MercuriusPlugins;

export type MercuriusDriverConfigFactory =
  GqlOptionsFactory<MercuriusDriverConfig>;
export type MercuriusDriverAsyncConfig =
  GqlModuleAsyncOptions<MercuriusDriverConfig>;
