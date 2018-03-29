import { MetadataScanner } from "@nestjs/core/metadata-scanner";
import { ExternalContextCreator } from "@nestjs/core/helpers/external-context-creator";
import { ModulesContainer } from "@nestjs/core/injector/modules-container";
import { MergeInfo } from "graphql-tools/dist/Interfaces";
export interface ResolverMetadata {
  name: string;
  type: string;
  methodName: string;
  callback?: Function;
}
export declare class ResolversExplorerService {
  private readonly modulesContainer;
  private readonly metadataScanner;
  private readonly externalContextCreator;
  constructor(
    modulesContainer: ModulesContainer,
    metadataScanner: MetadataScanner,
    externalContextCreator: ExternalContextCreator
  );
  explore(): any;
  flatMap(
    modules: Map<any, any>[],
    callback: (instance: any) => ResolverMetadata[]
  ): any;
  filterResolvers(instance: Object): ResolverMetadata[];
  exploreDelegates(): (mergeInfo: MergeInfo) => any;
  filterDelegates(instance: Object): ResolverMetadata[];
  extractMetadata(
    instance: any,
    prototype: any,
    methodName: string,
    filterPredicate: (resolverType: string, isDelegated: boolean) => boolean
  ): ResolverMetadata;
  groupMetadata(resolvers: ResolverMetadata[]): any;
  curryDelegates(delegates: any): (mergeInfo: MergeInfo) => any;
}
