import { isEmpty } from '@nestjs/common/utils/shared.utils';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { gql } from 'apollo-server-core';
import { makeExecutableSchema } from 'graphql-tools';
import * as chokidar from 'chokidar';
import { printSchema } from 'graphql';
import { GraphQLAstExplorer } from './graphql-ast.explorer';
import { GraphQLTypesLoader } from './graphql-types.loader';
import { removeTempField, extend } from './utils';

export class GraphQLDefinitionsFactory {
  private readonly gqlAstExplorer = new GraphQLAstExplorer();
  private readonly gqlTypesLoader = new GraphQLTypesLoader();

  async generate(options: {
    typePaths: string[];
    path: string;
    outputAs?: 'class' | 'interface';
    watch?: boolean;
    debug?: boolean;
    federation?: boolean;
  }) {
    const isDebugEnabled = !(options && options.debug === false);
    const typePathsExists = options.typePaths && !isEmpty(options.typePaths);
    const isFederation = options && options.federation;
    if (!typePathsExists) {
      throw new Error(`"typePaths" property cannot be empty.`);
    }
    if (options.watch) {
      this.printMessage('GraphQL factory is watching your files...', isDebugEnabled);
      const watcher = chokidar.watch(options.typePaths);
      watcher.on('change', async file => {
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
        );
      });
    }
    await this.exploreAndEmit(
      options.typePaths,
      options.path,
      options.outputAs,
      isFederation,
      isDebugEnabled,
    );
  }

  private async exploreAndEmit(
    typePaths: string[],
    path: string,
    outputAs: 'class' | 'interface',
    isFederation: boolean,
    isDebugEnabled: boolean,
  ) {
    if (isFederation) {
      return this.exploreAndEmitFederation(typePaths, path, outputAs, isDebugEnabled);
    }
    return this.exploreAndEmitRegular(typePaths, path, outputAs, isDebugEnabled);
  }

  private async exploreAndEmitFederation(
    typePaths: string[],
    path: string,
    outputAs: 'class' | 'interface',
    isDebugEnabled: boolean,
  ) {
    const typeDefs = await this.gqlTypesLoader.getTypesFromPaths(typePaths);

    const { buildFederatedSchema } = loadPackage('@apollo/federation', 'ApolloFederation');
    const { printSchema } = loadPackage('@apollo/federation', 'ApolloFederation');

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
  ) {
    const typeDefs = await this.gqlTypesLoader.mergeTypesByPaths(typePaths || []);
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
