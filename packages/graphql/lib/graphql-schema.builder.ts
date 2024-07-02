import { Injectable } from '@nestjs/common';
import { isString } from '@nestjs/common/utils/shared.utils';
import {
  GraphQLSchema,
  lexicographicSortSchema,
  printSchema as gqlPrintSchema,
} from 'graphql';
import { resolve } from 'path';
import { GRAPHQL_SDL_FILE_HEADER } from './graphql.constants';
import { AutoSchemaFileValue, GqlModuleOptions } from './interfaces';
import { BuildSchemaOptions } from './interfaces/build-schema-options.interface';
import { GraphQLSchemaFactory } from './schema-builder/graphql-schema.factory';
import { FileSystemHelper } from './schema-builder/helpers/file-system.helper';
import { ScalarsExplorerService } from './services';
import { getPathForAutoSchemaFile } from './utils';

@Injectable()
export class GraphQLSchemaBuilder {
  constructor(
    private readonly scalarsExplorerService: ScalarsExplorerService,
    private readonly gqlSchemaFactory: GraphQLSchemaFactory,
    private readonly fileSystemHelper: FileSystemHelper,
  ) {}

  public async build(
    autoSchemaFile: AutoSchemaFileValue,
    options: GqlModuleOptions,
    resolvers: Function[],
  ): Promise<any> {
    const scalarsMap = this.scalarsExplorerService.getScalarsMap();
    try {
      const buildSchemaOptions = options.buildSchemaOptions || {};
      return await this.generateSchema(
        resolvers,
        autoSchemaFile,
        {
          ...buildSchemaOptions,
          scalarsMap,
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

  public async generateSchema(
    resolvers: Function[],
    autoSchemaFile: AutoSchemaFileValue,
    options: BuildSchemaOptions = {},
    sortSchema?: boolean,
    transformSchema?: (
      schema: GraphQLSchema,
    ) => GraphQLSchema | Promise<GraphQLSchema>,
    printSchema?: (schema: GraphQLSchema) => string,
  ): Promise<GraphQLSchema> {
    const schema = await this.gqlSchemaFactory.create(resolvers, options);
    const filename = getPathForAutoSchemaFile(autoSchemaFile);

    if (filename) {
      const transformedSchema = transformSchema
        ? await transformSchema(schema)
        : schema;

      const base = sortSchema
        ? lexicographicSortSchema(transformedSchema)
        : transformedSchema;

      const gql = printSchema ? printSchema(base) : gqlPrintSchema(base);

      const fileContent = GRAPHQL_SDL_FILE_HEADER + gql;
      await this.fileSystemHelper.writeFile(filename, fileContent);
    }
    return schema;
  }
}
