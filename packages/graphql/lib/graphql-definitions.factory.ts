import { makeExecutableSchema } from '@graphql-tools/schema';
import { isEmpty } from '@nestjs/common/utils/shared.utils';
import * as chokidar from 'chokidar';
import { printSchema } from 'graphql';
import { gql } from 'graphql-tag';
import {
  DefinitionsGeneratorOptions,
  GraphQLAstExplorer,
} from './graphql-ast.explorer';
import { GraphQLTypesLoader } from './graphql-types.loader';
import { extend, removeTempField } from './utils';

export type GenerateOptions = DefinitionsGeneratorOptions & {
  typePaths: string[];
  path: string;
  outputAs?: 'class' | 'interface';
  watch?: boolean;
  debug?: boolean;
  typeDefs?: string | string[];
};

export class GraphQLDefinitionsFactory {
  protected readonly gqlAstExplorer = new GraphQLAstExplorer();
  protected readonly gqlTypesLoader = new GraphQLTypesLoader();

  async generate(options: GenerateOptions) {
    const isDebugEnabled = !(options && options.debug === false);
    const typePathsExists = options.typePaths && !isEmpty(options.typePaths);
    if (!typePathsExists) {
      throw new Error(`"typePaths" property cannot be empty.`);
    }

    const definitionsGeneratorOptions: DefinitionsGeneratorOptions = {
      emitTypenameField: options.emitTypenameField,
      skipResolverArgs: options.skipResolverArgs,
      defaultScalarType: options.defaultScalarType,
      customScalarTypeMapping: options.customScalarTypeMapping,
      additionalHeader: options.additionalHeader,
      defaultTypeMapping: options.defaultTypeMapping,
      enumsAsTypes: options.enumsAsTypes,
    };

    if (options.watch) {
      this.printMessage(
        'GraphQL factory is watching your files...',
        isDebugEnabled,
      );
      const watcher = chokidar.watch(options.typePaths);
      watcher.on('change', async (file) => {
        this.printMessage(
          `[${new Date().toLocaleTimeString()}] "${file}" has been changed.`,
          isDebugEnabled,
        );
        await this.exploreAndEmit(
          options.typePaths,
          options.path,
          options.outputAs,
          isDebugEnabled,
          definitionsGeneratorOptions,
          options.typeDefs,
        );
      });
    }
    await this.exploreAndEmit(
      options.typePaths,
      options.path,
      options.outputAs,
      isDebugEnabled,
      definitionsGeneratorOptions,
      options.typeDefs,
    );
  }

  protected async exploreAndEmit(
    typePaths: string[],
    path: string,
    outputAs: 'class' | 'interface',
    isDebugEnabled: boolean,
    definitionsGeneratorOptions: DefinitionsGeneratorOptions,
    typeDefs?: string | string[],
  ) {
    const typePathDefs = await this.gqlTypesLoader.mergeTypesByPaths(
      typePaths || [],
    );
    const mergedTypeDefs = extend(typePathDefs, typeDefs);
    if (!mergedTypeDefs) {
      throw new Error(`"typeDefs" property cannot be null.`);
    }
    let schema = makeExecutableSchema({
      typeDefs: mergedTypeDefs,
      resolverValidationOptions: { requireResolversToMatchSchema: 'ignore' },
    });
    schema = removeTempField(schema);
    const tsFile = await this.gqlAstExplorer.explore(
      gql`
        ${printSchema(schema)}
      `,
      path,
      outputAs,
      definitionsGeneratorOptions,
    );
    await tsFile.save();
    this.printMessage(
      `[${new Date().toLocaleTimeString()}] The definitions have been updated.`,
      isDebugEnabled,
    );
  }

  protected printMessage(text: string, isEnabled: boolean) {
    isEnabled && console.log(text);
  }
}
