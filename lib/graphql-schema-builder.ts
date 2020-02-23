import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { GraphQLSchema, specifiedDirectives } from 'graphql';
import { BuildSchemaOptions } from './external/type-graphql.types';
import { ScalarsExplorerService } from './services';
import { lazyMetadataStorage } from './storages/lazy-metadata.storage';

@Injectable()
export class GraphQLSchemaBuilder {
  constructor(
    private readonly scalarsExplorerService: ScalarsExplorerService,
  ) {}

  async build(
    autoSchemaFile: string | boolean,
    options: BuildSchemaOptions = {},
    resolvers: Function[],
  ): Promise<any> {
    lazyMetadataStorage.load();

    const buildSchema = this.loadBuildSchemaFactory();
    const scalarsMap = this.scalarsExplorerService.getScalarsMap();
    try {
      return await buildSchema({
        ...options,
        emitSchemaFile: autoSchemaFile !== true ? autoSchemaFile : false,
        scalarsMap,
        validate: false,
        resolvers,
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
    lazyMetadataStorage.load();

    const buildSchema = this.loadBuildSchemaFactory();
    const scalarsMap = this.scalarsExplorerService.getScalarsMap();

    try {
      return await buildSchema({
        ...options,
        directives: [
          ...specifiedDirectives,
          ...this.loadFederationDirectives(),
          ...((options && options.directives) || []),
        ],
        emitSchemaFile: autoSchemaFile !== true ? autoSchemaFile : false,
        validate: false,
        scalarsMap,
        resolvers,
        skipCheck: true,
      });
    } catch (err) {
      if (err && err.details) {
        console.error(err.details);
      }
      throw err;
    }
  }

  private loadBuildSchemaFactory(): (...args: any[]) => GraphQLSchema {
    const { buildSchema } = loadPackage('type-graphql', 'SchemaBuilder', () =>
      require('type-graphql'),
    );
    return buildSchema;
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
