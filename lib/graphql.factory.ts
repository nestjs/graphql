import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as glob from 'glob';
import { makeExecutableSchema } from 'graphql-tools';
import {
  IExecutableSchemaDefinition,
  MergeInfo,
} from 'graphql-tools/dist/Interfaces';
import { mergeTypes } from 'merge-graphql-schemas';
import { DelegatesExplorerService } from './services/delegates-explorer.service';
import { ResolversExplorerService } from './services/resolvers-explorer.service';
import { ScalarsExplorerService } from './services/scalars-explorer.service';
import { extend } from './utils/extend.util';

@Injectable()
export class GraphQLFactory {
  constructor(
    private readonly resolversExplorerService: ResolversExplorerService,
    private readonly delegatesExplorerService: DelegatesExplorerService,
    private readonly scalarsExplorerService: ScalarsExplorerService,
  ) {}

  createSchema(
    schemaDefintion: IExecutableSchemaDefinition = { typeDefs: [] },
  ) {
    const resolvers = extend(
      this.scalarsExplorerService.explore(),
      this.resolversExplorerService.explore(),
    );
    return makeExecutableSchema({
      ...schemaDefintion,
      resolvers: extend(resolvers, schemaDefintion.resolvers),
    });
  }

  createDelegates(): (mergeInfo: MergeInfo) => any {
    return this.delegatesExplorerService.explore();
  }

  mergeTypesByPaths(...pathsToTypes: string[]): string {
    return mergeTypes(...pathsToTypes.map(pattern => this.loadFiles(pattern)));
  }

  private loadFiles(pattern: string): any[] {
    const paths = glob.sync(pattern);
    return paths.map(path => fs.readFileSync(path, 'utf8'));
  }
}
