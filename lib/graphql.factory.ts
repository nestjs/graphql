import { Injectable } from '@nestjs/common';
import { gql, makeExecutableSchema, mergeSchemas } from 'apollo-server-express';
import * as fs from 'fs';
import * as glob from 'glob';
import { MergeInfo } from 'graphql-tools/dist/Interfaces';
import { flatten, isEmpty } from 'lodash';
import { mergeTypes } from 'merge-graphql-schemas';
import { GraphQLAstExplorer } from './graphql-ast.explorer';
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
    private readonly graphqlAstExplorer: GraphQLAstExplorer,
  ) {}

  async mergeOptions(
    options: GqlModuleOptions = { typeDefs: [] },
  ): Promise<GqlModuleOptions> {
    const resolvers = extend(
      this.scalarsExplorerService.explore(),
      this.resolversExplorerService.explore(),
    );

    if (isEmpty(options.typeDefs)) {
      return {
        ...options,
        typeDefs: undefined,
        schema: options.transformSchema
          ? await options.transformSchema(options.schema)
          : options.schema,
      };
    }
    const executableSchema = makeExecutableSchema({
      resolvers: extend(resolvers, options.resolvers),
      typeDefs: gql`
        ${options.typeDefs}
      `,
    });
    const schema = options.schema
      ? mergeSchemas({
          schemas: [options.schema, executableSchema],
        })
      : executableSchema;

    return {
      ...options,
      typeDefs: undefined,
      schema: options.transformSchema
        ? await options.transformSchema(schema)
        : schema,
    };
  }

  createDelegates(): (mergeInfo: MergeInfo) => any {
    return this.delegatesExplorerService.explore();
  }

  mergeTypesByPaths(...pathsToTypes: string[]): string {
    return mergeTypes(
      flatten(pathsToTypes.map(pattern => this.loadFiles(pattern))),
      { all: true },
    );
  }

  async generateDefinitions(typeDefs: string | string[], outputPath: string) {
    if (isEmpty(typeDefs)) {
      return;
    }
    const tsFile = this.graphqlAstExplorer.explore(
      gql`
        ${typeDefs}
      `,
      outputPath,
    );
    await tsFile.save();
  }

  private loadFiles(pattern: string): any[] {
    const paths = glob.sync(pattern);
    return paths.map(path => fs.readFileSync(path, 'utf8'));
  }
}
