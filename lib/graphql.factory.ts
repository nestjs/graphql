import { existsSync, lstatSync, readFileSync } from 'fs';
import { Injectable } from '@nestjs/common';
import { gql, makeExecutableSchema, mergeSchemas } from 'apollo-server-express';
import { MergeInfo } from 'graphql-tools/dist/Interfaces';
import { isEmpty } from 'lodash';
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
      directiveResolvers: options.directiveResolvers,
      schemaDirectives: options.schemaDirectives,
      typeDefs: gql`
        ${options.typeDefs}
      `,
      resolverValidationOptions: options.resolverValidationOptions,
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

  async generateDefinitions(
    typeDefs: string | string[],
    options: GqlModuleOptions,
  ) {
    if (isEmpty(typeDefs) || !options.definitions) {
      return;
    }
    const tsFile = this.graphqlAstExplorer.explore(
      gql`
        ${typeDefs}
      `,
      options.definitions.path,
      options.definitions.outputAs,
    );
    if (
      !existsSync(options.definitions.path) ||
      !lstatSync(options.definitions.path).isFile() ||
      readFileSync(options.definitions.path, 'utf8') !== tsFile.getText()
    ) {
      await tsFile.save();
    }
  }
}
