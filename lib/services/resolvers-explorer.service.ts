import { Inject, Injectable } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { GqlModuleOptions } from '..';
import { Resolvers } from '../enums/resolvers.enum';
import { GqlParamsFactory } from '../factories/params.factory';
import {
  GRAPHQL_MODULE_OPTIONS,
  PARAM_ARGS_METADATA,
  SUBSCRIPTION_TYPE,
} from '../graphql.constants';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';
import { extractMetadata } from '../utils/extract-metadata.util';
import { BaseExplorerService } from './base-explorer.service';

@Injectable()
export class ResolversExplorerService extends BaseExplorerService {
  private readonly gqlParamsFactory = new GqlParamsFactory();

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly metadataScanner: MetadataScanner,
    private readonly externalContextCreator: ExternalContextCreator,
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
    const resolvers = this.flatMap(modules, instance =>
      this.filterResolvers(instance),
    );
    return this.groupMetadata(resolvers);
  }

  filterResolvers(instance: Object): ResolverMetadata[] {
    if (!instance) {
      return undefined;
    }
    const prototype = Object.getPrototypeOf(instance);
    const predicate = (resolverType, isDelegated, isPropertyResolver) =>
      isUndefined(resolverType) ||
      isDelegated ||
      (!isPropertyResolver &&
        ![Resolvers.MUTATION, Resolvers.QUERY, Resolvers.SUBSCRIPTION].some(
          type => type === resolverType,
        ));

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
        PARAM_ARGS_METADATA,
        this.gqlParamsFactory,
      );
      return {
        ...resolver,
        callback: resolverCallback,
      };
    });
  }
}
