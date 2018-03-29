import { Injectable } from '@nestjs/common';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { flattenDeep, mapValues, groupBy } from 'lodash';
import {
  RESOLVER_TYPE_METADATA,
  RESOLVER_NAME_METADATA,
  RESOLVER_DELEGATE_METADATA,
} from './graphql.constants';
import { MergeInfo } from 'graphql-tools/dist/Interfaces';

export interface ResolverMetadata {
  name: string;
  type: string;
  methodName: string;
  callback?: Function;
}

@Injectable()
export class ResolversExplorerService {
  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly metadataScanner: MetadataScanner,
    private readonly externalContextCreator: ExternalContextCreator,
  ) {}

  explore() {
    const modules = [...this.modulesContainer.values()].map(
      module => module.components,
    );
    const resolvers = this.flatMap(modules, instance =>
      this.filterResolvers(instance),
    );
    return this.groupMetadata(resolvers);
  }

  flatMap(
    modules: Map<any, any>[],
    callback: (instance: any) => ResolverMetadata[],
  ) {
    return flattenDeep(
      modules.map(module =>
        [...module.values()].map(({ instance }) => callback(instance)),
      ),
    );
  }

  filterResolvers(instance: Object): ResolverMetadata[] {
    const prototype = Object.getPrototypeOf(instance);
    const predicate = (resolverType, isDelegated) =>
      isUndefined(resolverType) || isDelegated;
    const resolvers = this.metadataScanner.scanFromPrototype(
      instance,
      prototype,
      name => this.extractMetadata(instance, prototype, name, predicate),
    );
    return resolvers.filter(resolver => !!resolver).map(resolver => {
      if (resolver.type === 'Subscription') {
        return {
          ...resolver,
          callback: instance[resolver.methodName](),
        };
      }
      const resolverCallback = this.externalContextCreator.create(
        instance,
        prototype[resolver.methodName],
        resolver.methodName,
      );
      return {
        ...resolver,
        callback: resolverCallback,
      };
    });
  }

  exploreDelegates() {
    const modules = [...this.modulesContainer.values()].map(
      module => module.components,
    );
    const delegates = this.flatMap(modules, instance =>
      this.filterDelegates(instance),
    );
    return this.curryDelegates(this.groupMetadata(delegates));
  }

  filterDelegates(instance: Object): ResolverMetadata[] {
    const prototype = Object.getPrototypeOf(instance);
    const predicate = (resolverType, isDelegated) => !isDelegated;
    const resolvers = this.metadataScanner.scanFromPrototype(
      instance,
      prototype,
      name => this.extractMetadata(instance, prototype, name, predicate),
    );
    return resolvers.filter(resolver => !!resolver).map(resolver => {
      const callback = instance[resolver.methodName].bind(instance);
      return {
        ...resolver,
        callback,
      };
    });
  }

  extractMetadata(
    instance,
    prototype,
    methodName: string,
    filterPredicate: (resolverType: string, isDelegated: boolean) => boolean,
  ): ResolverMetadata {
    const callback = prototype[methodName];
    const resolverType =
      Reflect.getMetadata(RESOLVER_TYPE_METADATA, callback) ||
      Reflect.getMetadata(RESOLVER_TYPE_METADATA, instance.constructor);

    const resolverName = Reflect.getMetadata(RESOLVER_NAME_METADATA, callback);
    const isDelegated = !!Reflect.getMetadata(
      RESOLVER_DELEGATE_METADATA,
      callback,
    );
    if (filterPredicate(resolverType, isDelegated)) {
      return null;
    }
    return {
      name: resolverName || methodName,
      type: resolverType,
      methodName,
    };
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

  curryDelegates(delegates): (mergeInfo: MergeInfo) => any {
    return mergeInfo =>
      mapValues(delegates, parent =>
        mapValues(parent, (propertyFn, key) => propertyFn()(mergeInfo)),
      );
  }
}
