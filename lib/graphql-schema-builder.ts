import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { isString } from '@nestjs/common/utils/shared.utils';
import { GraphQLSchema, printSchema, specifiedDirectives } from 'graphql';
import { resolve } from 'path';
import { GRAPHQL_SDL_FILE_HEADER } from './graphql.constants';
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
    options: BuildSchemaOptions = {},
    resolvers: Function[],
  ): Promise<any> {
    const scalarsMap = this.scalarsExplorerService.getScalarsMap();
    try {
      return await this.buildSchema(resolvers, autoSchemaFile, {
        ...options,
        scalarsMap,
      });
    } catch (err) {
      if (err && err.details) {
        console.error(err.details);
      }
      throw err;
    }
  }

  async buildFederatedSchema(
    autoSchemaFile: string | boolean,
    options: BuildSchemaOptions = {},
    resolvers: Function[],
  ) {
    const scalarsMap = this.scalarsExplorerService.getScalarsMap();
    try {
      return await this.buildSchema(resolvers, autoSchemaFile, {
        ...options,
        directives: [
          ...specifiedDirectives,
          ...this.loadFederationDirectives(),
          ...((options && options.directives) || []),
        ],
        scalarsMap,
        skipCheck: true,
      });
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
  ): Promise<GraphQLSchema> {
    const schema = await this.gqlSchemaFactory.create(resolvers, options);
    if (typeof autoSchemaFile !== 'boolean') {
      const filename = isString(autoSchemaFile)
        ? autoSchemaFile
        : resolve(process.cwd(), 'schema.gql');

      const fileContent = GRAPHQL_SDL_FILE_HEADER + printSchema(schema);
      await this.fileSystemHelper.writeFile(filename, fileContent);
    }
    return schema;
  }

  private loadFederationDirectives() {
    const {
      federationDirectives,
    } = loadPackage('@apollo/federation/dist/directives', 'SchemaBuilder', () =>
      require('@apollo/federation/dist/directives'),
    );
    return federationDirectives;
  }
}
