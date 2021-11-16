import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
  GqlOptionsFactory,
} from '@nestjs/graphql-experimental';
import { MercuriusOptions } from 'mercurius';

export type MercuriusDriverConfig = GqlModuleOptions & MercuriusOptions;

export type MercuriusDriverConfigFactory =
  GqlOptionsFactory<MercuriusDriverConfig>;
export type MercuriusDriverAsyncConfig =
  GqlModuleAsyncOptions<MercuriusDriverConfig>;
