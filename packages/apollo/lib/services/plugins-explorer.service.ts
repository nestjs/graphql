import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper.js';
import { ModulesContainer } from '@nestjs/core/injector/modules-container.js';
import { BaseExplorerService, GqlModuleOptions } from '@nestjs/graphql';
import { PLUGIN_METADATA } from '../constants/index.js';

export class PluginsExplorerService extends BaseExplorerService {
  constructor(private readonly modulesContainer: ModulesContainer) {
    super();
  }

  explore(options: GqlModuleOptions) {
    const modules = this.getModules(
      this.modulesContainer,
      options.include || [],
    );
    return this.flatMap(modules, (instance) => this.filterPlugins(instance));
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
