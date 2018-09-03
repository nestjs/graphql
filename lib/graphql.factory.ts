import { Injectable } from '@nestjs/common';
import { gql, makeExecutableSchema, mergeSchemas } from 'apollo-server-express';
import * as fs from 'fs';
import * as glob from 'glob';
import { MergeInfo } from 'graphql-tools/dist/Interfaces';
import { flatten } from 'lodash';
import { mergeTypes } from 'merge-graphql-schemas';
import { GqlModuleOptions } from './interfaces/gql-module-options.interface';
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

  mergeOptions(options: GqlModuleOptions = { typeDefs: [] }): GqlModuleOptions {
    const resolvers = extend(
      this.scalarsExplorerService.explore(),
      this.resolversExplorerService.explore(),
    );
    
    let schema
    
    try {
      schema = makeExecutableSchema({
        resolvers: extend(resolvers, options.resolvers),
        typeDefs: gql`
          ${options.typeDefs}
        `,
      });
      
      // if we had an original schema, then merge both through the use of schema stitching
      // you could also opt to do it yourself though
      if (options.schema) {
        schema = mergeSchemas({
          schemas: [
            options.schema,
            schema
          ]
          // XXX: Type resolution not yet implemented, please use mergeSchemas yourself
        });
      }
    } catch (err) {
      // if the original schema is still there, use it as a fallback
      if (options.schema) {
        schema = options.schema
      } else {
        throw err; // otherwise re-throw it
      }
    }
   
    return {
      ...options,
      typeDefs: undefined,
      schema
    };
  }

  createDelegates(): (mergeInfo: MergeInfo) => any {
    return this.delegatesExplorerService.explore();
  }

  mergeTypesByPaths(...pathsToTypes: string[]): string {
    return mergeTypes(
      flatten(pathsToTypes.map(pattern => this.loadFiles(pattern))),
    );
  }

  private loadFiles(pattern: string): any[] {
    const paths = glob.sync(pattern);
    return paths.map(path => fs.readFileSync(path, 'utf8'));
  }
}
