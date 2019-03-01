import { Inject, Injectable } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { GraphQLScalarType } from 'graphql';
import {
  GRAPHQL_MODULE_OPTIONS,
  SCALAR_NAME_METADATA,
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
    return this.flatMap<any>(modules, instance => this.filterScalar(instance));
  }

  filterScalar<T extends any = any>(instance: T) {
    if (!instance) {
      return undefined;
    }
    const name = Reflect.getMetadata(
      SCALAR_NAME_METADATA,
      instance.constructor,
    );
    const bindContext = (fn: Function | undefined) =>
      fn ? fn.bind(instance) : undefined;

    return name
      ? {
          [name]: new GraphQLScalarType({
            name,
            description: instance['description'],
            parseValue: bindContext(instance.parseValue),
            serialize: bindContext(instance.serialize),
            parseLiteral: bindContext(instance.parseLiteral),
          }),
        }
      : undefined;
  }
}
