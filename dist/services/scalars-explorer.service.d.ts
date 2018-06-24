import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { BaseExplorerService } from './base-explorer.service';
export declare class ScalarsExplorerService extends BaseExplorerService {
  private readonly modulesContainer;
  private readonly metadataScanner;
  private readonly externalContextCreator;
  constructor(
    modulesContainer: ModulesContainer,
    metadataScanner: MetadataScanner,
    externalContextCreator: ExternalContextCreator,
  );
  explore(): any;
  filterScalar(
    instance: Object,
  ): {
    [x: number]: Object;
  };
}
