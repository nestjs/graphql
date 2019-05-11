import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { flattenDeep, groupBy, identity, isEmpty, mapValues } from 'lodash';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';

export class BaseExplorerService {
  getModules(
    modulesContainer: Map<string, Module>,
    include: Function[],
  ): Module[] {
    if (!include || isEmpty(include)) {
      return [...modulesContainer.values()];
    }
    const whitelisted = this.includeWhitelisted(modulesContainer, include);
    return whitelisted;
  }

  includeWhitelisted(
    modulesContainer: Map<string, Module>,
    include: Function[],
  ): Module[] {
    return [...modulesContainer.values()].filter(({ metatype }) =>
      include.some(item => item === metatype),
    );
  }

  flatMap<T = ResolverMetadata>(
    modules: Module[],
    callback: (instance: InstanceWrapper, moduleRef: Module) => T | T[],
  ): T[] {
    const invokeMap = () =>
      modules.map(module =>
        [...module.providers.values()].map(wrapper =>
          callback(wrapper, module),
        ),
      );
    return flattenDeep(invokeMap()).filter(identity);
  }

  groupMetadata(resolvers: ResolverMetadata[]) {
    const groupByType = groupBy(resolvers, metadata => metadata.type);
    return mapValues(groupByType, resolversArr =>
      resolversArr.reduce((prev, curr) => {
        return {
          ...prev,
          [curr.name]: curr.callback,
        };
      }, {}),
    );
  }
}
