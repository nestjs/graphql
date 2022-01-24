import { Inject, Injectable } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import {
  GRAPHQL_MODULE_OPTIONS,
  SCALAR_NAME_METADATA,
  SCALAR_TYPE_METADATA,
} from '../graphql.constants';
import { ScalarsTypeMap } from '../interfaces';
import { GqlModuleOptions } from '../interfaces/gql-module-options.interface';
import { createScalarType } from '../utils/scalar-types.utils';
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
    return this.flatMap<unknown>(modules, (instance) =>
      this.filterSchemaFirstScalar(instance),
    );
  }

  filterSchemaFirstScalar<T extends Record<string, Function | string> = any>(
    wrapper: InstanceWrapper<T>,
  ) {
    const { instance } = wrapper;
    if (!instance) {
      return undefined;
    }
    const scalarName: string = Reflect.getMetadata(
      SCALAR_NAME_METADATA,
      instance.constructor,
    );
    if (!scalarName) {
      return;
    }
    return {
      [scalarName]: createScalarType(scalarName, instance),
    };
  }

  getScalarsMap(): ScalarsTypeMap[] {
    const modules = this.getModules(
      this.modulesContainer,
      this.gqlOptions.include || [],
    );
    return this.flatMap<ScalarsTypeMap>(modules, (instance) =>
      this.filterCodeFirstScalar(instance),
    );
  }

  filterCodeFirstScalar<T extends Record<string, Function | string> = any>(
    wrapper: InstanceWrapper<T>,
  ) {
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
    if (!scalarNameMetadata) {
      return;
    }
    const typeRef =
      (isFunction(scalarTypeMetadata) && scalarTypeMetadata()) ||
      instance.constructor;

    return {
      type: typeRef,
      scalar: createScalarType(scalarNameMetadata, instance),
    };
  }
}
