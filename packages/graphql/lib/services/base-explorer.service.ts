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
    const invokeMap = () => {
      return modules.map((moduleRef) => {
        const providers = [...moduleRef.providers.values()];
        return providers.map((wrapper) => callback(wrapper, moduleRef));
      });
    };
    return flattenDeep(invokeMap()).filter(identity);
  }

  groupMetadata(resolvers: ResolverMetadata[]) {
    const groupByType = groupBy(
      resolvers,
      (metadata: ResolverMetadata) => metadata.type,
    );
    const groupedMetadata = mapValues(
      groupByType,
      (resolversArr: ResolverMetadata[]) =>
        resolversArr.reduce(
          (prev, curr) => ({
            ...prev,
            [curr.name]: curr.callback,
          }),
          {},
        ),
    );
    return groupedMetadata;
  }
}
