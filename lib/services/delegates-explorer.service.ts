import { Injectable } from '@nestjs/common';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { MergeInfo } from 'graphql-tools/dist/Interfaces';
import { mapValues } from 'lodash';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';
import { extractMetadata } from '../utils/extract-metadata.util';
import { BaseExplorerService } from './base-explorer.service';

@Injectable()
export class DelegatesExplorerService extends BaseExplorerService {
  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly metadataScanner: MetadataScanner,
    private readonly externalContextCreator: ExternalContextCreator,
  ) {
    super();
  }

  explore() {
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
      name => extractMetadata(instance, prototype, name, predicate),
    );
    return resolvers.filter(resolver => !!resolver).map(resolver => {
      const callback = instance[resolver.methodName].bind(instance);
      return {
        ...resolver,
        callback,
      };
    });
  }

  curryDelegates(delegates): (mergeInfo: MergeInfo) => any {
    return mergeInfo =>
      mapValues(delegates, parent =>
        mapValues(parent, (propertyFn, key) => propertyFn()(mergeInfo)),
      );
  }
}
