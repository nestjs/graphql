import { Inject, Injectable } from '@nestjs/common';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { mapValues } from 'lodash';
import { GRAPHQL_MODULE_OPTIONS } from '../graphql.constants';
import { GqlModuleOptions } from '../interfaces/gql-module-options.interface';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';
import { extractMetadata } from '../utils/extract-metadata.util';
import { BaseExplorerService } from './base-explorer.service';

@Injectable()
export class DelegatesExplorerService extends BaseExplorerService {
  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly metadataScanner: MetadataScanner,
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
    const delegates = this.flatMap(modules, instance =>
      this.filterDelegates(instance),
    );
    return this.curryDelegates(this.groupMetadata(delegates));
  }

  filterDelegates(wrapper: InstanceWrapper): ResolverMetadata[] {
    const { instance } = wrapper;
    if (!instance) {
      return undefined;
    }
    const prototype = Object.getPrototypeOf(instance);
    const predicate = (resolverType, isDelegated) => !isDelegated;
    const resolvers = this.metadataScanner.scanFromPrototype(
      instance,
      prototype,
      name => extractMetadata(instance, prototype, name, predicate),
    );
    return resolvers
      .filter(resolver => !!resolver)
      .map(resolver => {
        const callback = instance[resolver.methodName].bind(instance);
        return {
          ...resolver,
          callback,
        };
      });
  }

  curryDelegates(delegates): (mergeInfo: any) => any {
    return mergeInfo =>
      mapValues(delegates, parent =>
        mapValues(parent, (propertyFn, key) => propertyFn()(mergeInfo)),
      );
  }
}
