import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { isString } from '@nestjs/common/utils/shared.utils';
import {
  GraphQLSchema,
  lexicographicSortSchema,
  printSchema,
  specifiedDirectives,
} from 'graphql';
import { resolve } from 'path';
import { GRAPHQL_SDL_FILE_HEADER } from './graphql.constants';
import { GqlModuleOptions } from './interfaces';
import { BuildSchemaOptions } from './interfaces/build-schema-options.interface';
import { GraphQLSchemaFactory } from './schema-builder/graphql-schema.factory';
import { FileSystemHelper } from './schema-builder/helpers/file-system.helper';
import { ScalarsExplorerService } from './services';

@Injectable()
export class GraphQLSchemaBuilder {
  constructor(
    private readonly scalarsExplorerService: ScalarsExplorerService,
    private readonly gqlSchemaFactory: GraphQLSchemaFactory,
    private readonly fileSystemHelper: FileSystemHelper,
  ) {}

  async build(
    autoSchemaFile: string | boolean,
    options: GqlModuleOptions,
    resolvers: Function[],
  ): Promise<any> {
    const scalarsMap = this.scalarsExplorerService.getScalarsMap();
    try {
      const buildSchemaOptions = options.buildSchemaOptions || {};
      return await this.buildSchema(
        resolvers,
        autoSchemaFile,
        {
          ...buildSchemaOptions,
          scalarsMap,
          schemaDirectives: options.schemaDirectives,
          schemaTransforms: options.schemaTransforms,
        },
        options.sortSchema,
        options.transformAutoSchemaFile && options.transformSchema,
      );
    } catch (err) {
      if (err && err.details) {
        console.error(err.details);
      }
      throw err;
    }
  }

  async buildFederatedSchema(
    autoSchemaFile: string | boolean,
    options: GqlModuleOptions,
    resolvers: Function[],
  ) {
    const scalarsMap = this.scalarsExplorerService.getScalarsMap();
    try {
      const buildSchemaOptions = options.buildSchemaOptions || {};
      return await this.buildSchema(
        resolvers,
        autoSchemaFile,
        {
          ...buildSchemaOptions,
          directives: [
            ...specifiedDirectives,
            ...this.loadFederationDirectives(),
            ...((buildSchemaOptions && buildSchemaOptions.directives) || []),
          ],
          scalarsMap,
          schemaDirectives: options.schemaDirectives,
          skipCheck: true,
        },
        options.sortSchema,
        options.transformAutoSchemaFile && options.transformSchema,
      );
    } catch (err) {
      if (err && err.details) {
        console.error(err.details);
      }
      throw err;
    }
  }

  private async buildSchema(
    resolvers: Function[],
    autoSchemaFile: boolean | string,
    options: BuildSchemaOptions = {},
    sortSchema?: boolean,
    transformSchema?: (
      schema: GraphQLSchema,
    ) => GraphQLSchema | Promise<GraphQLSchema>,
  ): Promise<GraphQLSchema> {
    const schema = await this.gqlSchemaFactory.create(resolvers, options);
    if (typeof autoSchemaFile !== 'boolean') {
      const filename = isString(autoSchemaFile)
        ? autoSchemaFile
        : resolve(process.cwd(), 'schema.gql');

      const transformedSchema = transformSchema
        ? await transformSchema(schema)
        : schema;
      const fileContent =
        GRAPHQL_SDL_FILE_HEADER +
        printSchema(
          sortSchema
            ? lexicographicSortSchema(transformedSchema)
            : transformedSchema,
        );
      await this.fileSystemHelper.writeFile(filename, fileContent);
    }
    return schema;
  }

  private loadFederationDirectives() {
    const { federationDirectives, directivesWithNoDefinitionNeeded } =
      loadPackage('@apollo/subgraph/dist/directives', 'SchemaBuilder', () =>
        require('@apollo/subgraph/dist/directives'),
      );
    return federationDirectives ?? directivesWithNoDefinitionNeeded;
  }
}
