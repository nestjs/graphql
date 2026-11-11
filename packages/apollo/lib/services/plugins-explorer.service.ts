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
    if (!instance || wrapper.isAlias) {
      return undefined;
    }
    const metadata = Reflect.getMetadata(PLUGIN_METADATA, instance.constructor);
    if (!metadata) {
      return undefined;
    }
    // Plugins are handed to Apollo Server once: the instance of a plugin that
    // is not static is a placeholder whose constructor never ran
    if (!wrapper.isDependencyTreeStatic() || wrapper.isTransient) {
      throw new Error(
        `"${instance.constructor.name}" plugin is request or transient-scoped, or depends on a request-scoped provider. Classes annotated with the "@Plugin()" decorator must be static (singleton).`,
      );
    }
    return instance;
  }
}
