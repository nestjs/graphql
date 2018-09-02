import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { Config, ServerRegistration } from 'apollo-server-express';

export interface GqlModuleOptions
  extends Config,
    Partial<
      Pick<ServerRegistration, 'onHealthCheck' | 'disableHealthCheck' | 'path'>
    > {
  typePaths?: string[];
  include?: Function[];
  installSubscriptionHandlers?: boolean;
}

export interface GqlOptionsFactory {
  createGqlOptions(): Promise<GqlModuleOptions> | GqlModuleOptions;
}

export interface GqlModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<GqlOptionsFactory>;
  useClass?: Type<GqlOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<GqlModuleOptions> | GqlModuleOptions;
  inject?: any[];
}
