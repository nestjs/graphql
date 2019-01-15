import { Injectable, Logger } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { GraphQLSchema } from 'graphql';
import { addResolveFunctionsToSchema } from 'graphql-tools';
import { MULTIPLE_GRAPHQL_ERROR } from './errors';
import { BuildSchemaOptions } from './external/type-graphql.types';
import { ScalarsExplorerService } from './services/scalars-explorer.service';

@Injectable()
export class GraphQLSchemaBuilder {
  private readonly logger = new Logger(GraphQLSchemaBuilder.name);

  constructor(
    private readonly scalarsExplorerService: ScalarsExplorerService,
  ) {}

  async build(
    emitSchemaFile: string | boolean,
    resolvers: any,
    options: BuildSchemaOptions = {},
  ): Promise<any> {
    try {
      const buildSchema = this.loadBuildSchemaFactory();
      const scalarsMap = this.scalarsExplorerService.getScalarsMap();
      const schema = await buildSchema({
        ...options,
        emitSchemaFile,
        scalarsMap,
        resolvers: ['**/*.undefined.undefined.js'], // NOTE: Added to omit options validation
      });
      addResolveFunctionsToSchema({ schema, resolvers });
      return schema;
    } catch (err) {
      this.logger.error(MULTIPLE_GRAPHQL_ERROR);
      throw err;
    }
    /**
     * Workaround
     * Ref: https://19majkel94.github.io/type-graphql/docs/faq.html#i-got-error-like-cannot-use-graphqlschema-object-object-from-another-module-or-realm-how-to-fix-that
    return await new Promise<string>((resolve, reject) =>
      readFile(
        emitSchemaFile,
        'utf8',
        (err, data) => (err ? reject(err) : resolve(data)),
      ),
    );
    **/
  }

  private loadBuildSchemaFactory(): (...args: any[]) => GraphQLSchema {
    const { buildSchema } = loadPackage('type-graphql', 'SchemaBuilder');
    return buildSchema;
  }
}
