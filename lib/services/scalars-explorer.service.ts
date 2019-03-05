import { Inject, Injectable } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { GraphQLScalarType } from 'graphql';
import {
  GRAPHQL_MODULE_OPTIONS,
  SCALAR_NAME_METADATA,
  SCALAR_TYPE_METADATA,
} from '../graphql.constants';
import { GqlModuleOptions } from '../interfaces/gql-module-options.interface';
import { BaseExplorerService } from './base-explorer.service';

@Injectable()
export class ScalarsExplorerService extends BaseExplorerService {
  constructor(
    private readonly modulesContainer: ModulesContainer,
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
    return this.flatMap<any>(modules, instance =>
      this.filterImplicitScalar(instance),
    );
  }

  filterImplicitScalar<T extends any = any>(wrapper: InstanceWrapper<T>) {
    const { instance } = wrapper;
    if (!instance) {
      return undefined;
    }
    const metadata = Reflect.getMetadata(
      SCALAR_NAME_METADATA,
      instance.constructor,
    );
    const bindContext = (fn: Function | undefined) =>
      fn ? fn.bind(instance) : undefined;

    return metadata
      ? {
          [(metadata as any) as string]: new GraphQLScalarType({
            name: (metadata as any) as string,
            description: instance['description'],
            parseValue: bindContext(instance.parseValue),
            serialize: bindContext(instance.serialize),
            parseLiteral: bindContext(instance.parseLiteral),
          }),
        }
      : undefined;
  }

  getScalarsMap() {
    const modules = this.getModules(
      this.modulesContainer,
      this.gqlOptions.include || [],
    );
    return this.flatMap<any>(modules, instance =>
      this.filterExplicitScalar(instance),
    );
  }

  filterExplicitScalar<T extends any = any>(wrapper: InstanceWrapper<T>) {
    const { instance } = wrapper;
    if (!instance) {
      return undefined;
    }
    const scalarNameMetadata = Reflect.getMetadata(
      SCALAR_NAME_METADATA,
      instance.constructor,
    );
    const scalarTypeMetadata = Reflect.getMetadata(
      SCALAR_TYPE_METADATA,
      instance.constructor,
    );
    const bindContext = (fn: Function | undefined) =>
      fn ? fn.bind(instance) : undefined;

    return scalarNameMetadata
      ? {
          type:
            (isFunction(scalarTypeMetadata) && scalarTypeMetadata()) ||
            instance.constructor,
          scalar: new GraphQLScalarType({
            name: scalarNameMetadata,
            description: instance['description'],
            parseValue: bindContext(instance.parseValue),
            serialize: bindContext(instance.serialize),
            parseLiteral: bindContext(instance.parseLiteral),
          }),
        }
      : undefined;
  }
}
