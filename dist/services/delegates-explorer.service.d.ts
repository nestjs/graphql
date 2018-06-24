import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { MergeInfo } from 'graphql-tools/dist/Interfaces';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';
import { BaseExplorerService } from './base-explorer.service';
export declare class DelegatesExplorerService extends BaseExplorerService {
  private readonly modulesContainer;
  private readonly metadataScanner;
  private readonly externalContextCreator;
  constructor(
    modulesContainer: ModulesContainer,
    metadataScanner: MetadataScanner,
    externalContextCreator: ExternalContextCreator,
  );
  explore(): (mergeInfo: MergeInfo) => any;
  filterDelegates(instance: Object): ResolverMetadata[];
  curryDelegates(delegates: any): (mergeInfo: MergeInfo) => any;
}
