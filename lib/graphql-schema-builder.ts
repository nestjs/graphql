import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { GraphQLSchema } from 'graphql';
import { BuildSchemaOptions } from './external/type-graphql.types';
import { ScalarsExplorerService } from './services/scalars-explorer.service';
import { lazyMetadataStorage } from './storages/lazy-metadata.storage';

@Injectable()
export class GraphQLSchemaBuilder {
  constructor(
    private readonly scalarsExplorerService: ScalarsExplorerService,
  ) {}

  async build(
    emitSchemaFile: string | boolean,
    options: BuildSchemaOptions = {},
  ): Promise<any> {
    lazyMetadataStorage.load();

    const buildSchema = this.loadBuildSchemaFactory();
    const scalarsMap = this.scalarsExplorerService.getScalarsMap();
    return await buildSchema({
      ...options,
      emitSchemaFile,
      scalarsMap,
      resolvers: ['---.js'], // NOTE: Added to omit options validation
    });
  }

  private loadBuildSchemaFactory(): (...args: any[]) => GraphQLSchema {
    const { buildSchema } = loadPackage('type-graphql', 'SchemaBuilder', () =>
      require('type-graphql'),
    );
    return buildSchema;
  }
}
