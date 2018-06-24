import {
  IExecutableSchemaDefinition,
  MergeInfo,
} from 'graphql-tools/dist/Interfaces';
import { DelegatesExplorerService } from './services/delegates-explorer.service';
import { ResolversExplorerService } from './services/resolvers-explorer.service';
import { ScalarsExplorerService } from './services/scalars-explorer.service';
export declare class GraphQLFactory {
  private readonly resolversExplorerService;
  private readonly delegatesExplorerService;
  private readonly scalarsExplorerService;
  constructor(
    resolversExplorerService: ResolversExplorerService,
    delegatesExplorerService: DelegatesExplorerService,
    scalarsExplorerService: ScalarsExplorerService,
  );
  createSchema(schemaDefintion?: IExecutableSchemaDefinition): any;
  createDelegates(): (mergeInfo: MergeInfo) => any;
  mergeTypesByPaths(...pathsToTypes: string[]): string;
  private loadFiles(pattern);
}
