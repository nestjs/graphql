import { Injectable } from '@nestjs/common';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { SCALAR_NAME_METADATA } from '../graphql.constants';
import { BaseExplorerService } from './base-explorer.service';

@Injectable()
export class ScalarsExplorerService extends BaseExplorerService {
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
    return this.flatMap<any>(modules, instance => this.filterScalar(instance));
  }

  filterScalar(instance: Object) {
    const scalarName = Reflect.getMetadata(
      SCALAR_NAME_METADATA,
      instance.constructor,
    );

    if (!scalarName) {
      return undefined;
    }
    return {
      [scalarName]: instance,
    };
  }
}
