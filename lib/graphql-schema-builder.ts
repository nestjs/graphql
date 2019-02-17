import { Injectable, Logger } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { readFile } from 'fs';
import { GraphQLSchema } from 'graphql';
import { BuildSchemaOptions } from './external/type-graphql.types';
import { ScalarsExplorerService } from './services/scalars-explorer.service';

@Injectable()
export class GraphQLSchemaBuilder {
  private readonly logger = new Logger(GraphQLSchemaBuilder.name);

  constructor(
    private readonly scalarsExplorerService: ScalarsExplorerService,
  ) {}

  async build(
    emitSchemaFile: string,
    options: BuildSchemaOptions = {},
  ): Promise<string> {
    const buildSchema = this.loadBuildSchemaFactory();
    const scalarsMap = this.scalarsExplorerService.getScalarsMap();
    await buildSchema({
      ...options,
      emitSchemaFile,
      scalarsMap,
      resolvers: ['**/*.undefined.undefined.js'], // NOTE: Added to omit options validation
    });
    /**
     * Workaround
     * Ref: https://19majkel94.github.io/type-graphql/docs/faq.html#i-got-error-like-cannot-use-graphqlschema-object-object-from-another-module-or-realm-how-to-fix-that
     */
    return await new Promise<string>((resolve, reject) =>
      readFile(emitSchemaFile, 'utf8', (err, data) =>
        err ? reject(err) : resolve(data),
      ),
    );
  }

  private loadBuildSchemaFactory(): (...args: any[]) => GraphQLSchema {
    const { buildSchema } = loadPackage('type-graphql', 'SchemaBuilder', () =>
      require('type-graphql'),
    );
    return buildSchema;
  }
}
