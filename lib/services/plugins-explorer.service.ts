import { Inject, Injectable } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { GRAPHQL_MODULE_OPTIONS, PLUGIN_METADATA } from '../graphql.constants';
import { GqlModuleOptions } from '../interfaces/gql-module-options.interface';
import { BaseExplorerService } from './base-explorer.service';

@Injectable()
export class PluginsExplorerService extends BaseExplorerService {
  constructor(
    private readonly modulesContainer: ModulesContainer,
    @Inject(GRAPHQL_MODULE_OPTIONS)
    private readonly gqlOptions: GqlModuleOptions,
  ) {
    super();
  }

  explore() {
    const modules = this.getModules(
      this.modulesContainer,
      this.gqlOptions.include || [],
    );
    return this.flatMap<any>(modules, (instance) =>
      this.filterPlugins(instance),
    );
  }

  filterPlugins<T = any>(wrapper: InstanceWrapper<T>) {
    const { instance } = wrapper;
    if (!instance) {
      return undefined;
    }
    const metadata = Reflect.getMetadata(PLUGIN_METADATA, instance.constructor);
    return metadata ? instance : undefined;
  }
}
