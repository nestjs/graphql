import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper.js';
import { Module } from '@nestjs/core/injector/module.js';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface.js';

export class BaseExplorerService {
  getModules(
    modulesContainer: Map<string, Module> | undefined,
    include: Function[],
  ): Module[] {
    if (!modulesContainer) {
      return [];
    }
    if (!include || include.length === 0) {
      return [...modulesContainer.values()];
    }
    const explicitlyWhitelisted = this.includeWhitelisted(
      modulesContainer,
      include,
    );
    const modulesToInclude = [];
    const toCheck = [...explicitlyWhitelisted];
    while (toCheck.length) {
      const moduleRef = toCheck.pop();
      if (!modulesToInclude.includes(moduleRef)) {
        modulesToInclude.push(moduleRef);
        toCheck.push(...moduleRef.imports);
      }
    }

    return modulesToInclude;
  }

  includeWhitelisted(
    modulesContainer: Map<string, Module>,
    include: Function[],
  ): Module[] {
    const modules = [...modulesContainer.values()];
    return modules.filter(({ metatype }) =>
      include.some((item) => item === metatype),
    );
  }

  flatMap<T = ResolverMetadata>(
    modules: Module[],
    callback: (instance: InstanceWrapper, moduleRef: Module) => T | T[],
  ): T[] {
    return modules.reduce<T[]>((collected, moduleRef) => {
      const providers = [...moduleRef.providers.values()];
      for (const wrapper of providers) {
        const result = callback(wrapper, moduleRef);
        if (Array.isArray(result)) {
          collected.push(...result.filter(Boolean));
        } else if (result) {
          collected.push(result);
        }
      }
      return collected;
    }, []);
  }

  groupMetadata(resolvers: ResolverMetadata[]) {
    return resolvers.reduce<
      Record<string, Record<string, ResolverMetadata['callback']>>
    >((grouped, metadata) => {
      grouped[metadata.type] ??= {};
      grouped[metadata.type][metadata.name] = metadata.callback;
      return grouped;
    }, {});
  }
}
