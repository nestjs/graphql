import * as glob from 'glob';
import * as fs from 'fs';
import { Component, Inject } from '@nestjs/common';
import { makeExecutableSchema } from 'graphql-tools';
import { mergeTypes } from 'merge-graphql-schemas';
import { groupBy, mapValues } from 'lodash';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { ResolversExplorerService } from './resolvers-explorer.service';
import {
  IExecutableSchemaDefinition,
  MergeInfo,
} from 'graphql-tools/dist/Interfaces';

@Component()
export class GraphQLFactory {
  constructor(
    private readonly resolversExplorerService: ResolversExplorerService,
  ) {}

  createSchema(
    schemaDefintion: IExecutableSchemaDefinition = { typeDefs: {} },
  ) {
    return makeExecutableSchema({
      ...schemaDefintion,
      resolvers: this.resolversExplorerService.explore(),
    });
  }

  createDelegates(): (mergeInfo: MergeInfo) => any {
    return this.resolversExplorerService.exploreDelegates();
  }

  mergeTypesByPaths(...pathsToTypes: string[]): string {
    return mergeTypes(
      ...pathsToTypes.map(pattern => this.loadFiles(pattern)),
    );
  }

  private loadFiles(pattern: string): any[] {
    const paths = glob.sync(pattern);
    return paths.map(path => fs.readFileSync(path, 'utf8'));
  }
}
