import { ResolversExplorerService } from './resolvers-explorer.service';
import {
  IExecutableSchemaDefinition,
  MergeInfo,
} from 'graphql-tools/dist/Interfaces';
export declare class GraphQLFactory {
  private readonly resolversExplorerService;
  constructor(resolversExplorerService: ResolversExplorerService);
  createSchema(schemaDefintion?: IExecutableSchemaDefinition): any;
  createDelegates(): (mergeInfo: MergeInfo) => any;
  mergeTypesByPaths(...pathsToTypes: string[]): string;
  private loadFiles(pattern);
}
