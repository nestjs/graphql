import { Injectable } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { SUBSCRIPTION_TYPE } from '../graphql.constants';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';
import { extractMetadata } from '../utils/extract-metadata.util';
import { BaseExplorerService } from './base-explorer.service';

@Injectable()
export class ResolversExplorerService extends BaseExplorerService {
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
    const resolvers = this.flatMap(modules, instance =>
      this.filterResolvers(instance),
    );
    return this.groupMetadata(resolvers);
  }

  filterResolvers(instance: Object): ResolverMetadata[] {
    const prototype = Object.getPrototypeOf(instance);
    const predicate = (resolverType, isDelegated) =>
      isUndefined(resolverType) || isDelegated;
    const resolvers = this.metadataScanner.scanFromPrototype(
      instance,
      prototype,
      name => extractMetadata(instance, prototype, name, predicate),
    );
    return resolvers.filter(resolver => !!resolver).map(resolver => {
      if (resolver.type === SUBSCRIPTION_TYPE) {
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
}
