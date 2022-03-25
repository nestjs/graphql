import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
} from '@nestjs/graphql';
import { MercuriusOptions } from 'mercurius';
import { MercuriusDriverPlugins } from './mercurius-driver-plugin.interface';

export type MercuriusDriverConfig = GqlModuleOptions &
  MercuriusOptions &
  MercuriusDriverPlugins;

export type MercuriusDriverConfigFactory =
  GqlOptionsFactory<MercuriusDriverConfig>;
export type MercuriusDriverAsyncConfig =
  GqlModuleAsyncOptions<MercuriusDriverConfig>;
