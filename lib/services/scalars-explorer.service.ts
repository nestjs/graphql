import { Injectable } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { SCALAR_NAME_METADATA } from '../graphql.constants';
import { BaseExplorerService } from './base-explorer.service';

@Injectable()
export class ScalarsExplorerService extends BaseExplorerService {
  constructor(private readonly modulesContainer: ModulesContainer) {
    super();
  }

  explore() {
    const modules = [...this.modulesContainer.values()].map(
      module => module.components,
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
