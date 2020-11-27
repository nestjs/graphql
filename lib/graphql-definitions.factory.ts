import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { isEmpty } from '@nestjs/common/utils/shared.utils';
import { gql } from 'apollo-server-core';
import * as chokidar from 'chokidar';
import { printSchema } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import {
  DefinitionsGeneratorOptions,
  GraphQLAstExplorer,
} from './graphql-ast.explorer';
import { GraphQLTypesLoader } from './graphql-types.loader';
import { removeTempField } from './utils';

export class GraphQLDefinitionsFactory {
  private readonly gqlAstExplorer = new GraphQLAstExplorer();
  private readonly gqlTypesLoader = new GraphQLTypesLoader();

  async generate(
    options: {
      typePaths: string[];
      path: string;
      outputAs?: 'class' | 'interface';
      watch?: boolean;
      debug?: boolean;
      federation?: boolean;
    } & DefinitionsGeneratorOptions,
  ) {
    const isDebugEnabled = !(options && options.debug === false);
    const typePathsExists = options.typePaths && !isEmpty(options.typePaths);
    if (!typePathsExists) {
      throw new Error(`"typePaths" property cannot be empty.`);
    }

    const isFederation = options && options.federation;
    const definitionsGeneratorOptions: DefinitionsGeneratorOptions = {
      emitTypenameField: options.emitTypenameField,
      skipResolverArgs: options.skipResolverArgs,
      defaultScalarType: options.defaultScalarType,
      customScalarTypeMapping: options.customScalarTypeMapping,
      additionalHeader: options.additionalHeader,
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
          isFederation,
          isDebugEnabled,
          definitionsGeneratorOptions,
        );
      });
    }
    await this.exploreAndEmit(
      options.typePaths,
      options.path,
      options.outputAs,
      isFederation,
      isDebugEnabled,
      definitionsGeneratorOptions,
    );
  }

  private async exploreAndEmit(
    typePaths: string[],
    path: string,
    outputAs: 'class' | 'interface',
    isFederation: boolean,
    isDebugEnabled: boolean,
    definitionsGeneratorOptions: DefinitionsGeneratorOptions = {},
  ) {
    if (isFederation) {
      return this.exploreAndEmitFederation(
        typePaths,
        path,
        outputAs,
        isDebugEnabled,
        definitionsGeneratorOptions,
      );
    }
    return this.exploreAndEmitRegular(
      typePaths,
      path,
      outputAs,
      isDebugEnabled,
      definitionsGeneratorOptions,
    );
  }

  private async exploreAndEmitFederation(
    typePaths: string[],
    path: string,
    outputAs: 'class' | 'interface',
    isDebugEnabled: boolean,
    definitionsGeneratorOptions: DefinitionsGeneratorOptions,
  ) {
    const typeDefs = await this.gqlTypesLoader.mergeTypesByPaths(typePaths);

    const {
      buildFederatedSchema,
      printSchema,
    } = loadPackage('@apollo/federation', 'ApolloFederation', () =>
      require('@apollo/federation'),
    );

    const schema = buildFederatedSchema([
      {
        typeDefs: gql`
          ${typeDefs}
        `,
        resolvers: {},
      },
    ]);
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

  private async exploreAndEmitRegular(
    typePaths: string[],
    path: string,
    outputAs: 'class' | 'interface',
    isDebugEnabled: boolean,
    definitionsGeneratorOptions: DefinitionsGeneratorOptions,
  ) {
    const typeDefs = await this.gqlTypesLoader.mergeTypesByPaths(
      typePaths || [],
    );
    if (!typeDefs) {
      throw new Error(`"typeDefs" property cannot be null.`);
    }
    let schema = makeExecutableSchema({
      typeDefs,
      resolverValidationOptions: { allowResolversNotInSchema: true },
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

  private printMessage(text: string, isEnabled: boolean) {
    isEnabled && console.log(text);
  }
}
