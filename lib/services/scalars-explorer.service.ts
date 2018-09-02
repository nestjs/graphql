import { Inject, Injectable } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { GqlModuleOptions } from '..';
import {
  GRAPHQL_MODULE_OPTIONS,
  SCALAR_NAME_METADATA,
} from '../graphql.constants';
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

  filterScalar(instance: Object) {
    if (!instance) {
      return undefined;
    }
    const scalarName = Reflect.getMetadata(
      SCALAR_NAME_METADATA,
      instance.constructor,
    );
    return scalarName
      ? {
          [scalarName]: instance,
        }
      : undefined;
  }
}
