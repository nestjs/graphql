import { isEmpty } from '@nestjs/common/utils/shared.utils';
import { gql, makeExecutableSchema } from 'apollo-server-express';
import * as chokidar from 'chokidar';
import { printSchema } from 'graphql';
import { GraphQLAstExplorer } from './graphql-ast.explorer';
import { GraphQLTypesLoader } from './graphql-types.loader';

export class GraphQLDefinitionsFactory {
  private readonly gqlAstExplorer = new GraphQLAstExplorer();
  private readonly gqlTypesLoader = new GraphQLTypesLoader();

  async generate(options: {
    typePaths: string[];
    path: string;
    outputAs?: 'class' | 'interface';
    watch?: boolean;
  }) {
    const typePathsExists = options.typePaths && !isEmpty(options.typePaths);
    if (!typePathsExists) {
      throw new Error(`"typePaths" property cannot be empty.`);
    }
    if (options.watch) {
      console.log('GraphQL factory is watching your files...');
      const watcher = chokidar.watch(options.typePaths);
      watcher.on('change', async file => {
        console.log(
          `[${new Date().toLocaleTimeString()}] "${file}" has been changed.`,
        );
        await this.exploreAndEmit(
          options.typePaths,
          options.path,
          options.outputAs,
        );
      });
    }
    await this.exploreAndEmit(
      options.typePaths,
      options.path,
      options.outputAs,
    );
  }

  private async exploreAndEmit(
    typePaths: string[],
    path: string,
    outputAs: 'class' | 'interface',
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

    const tsFile = this.gqlAstExplorer.explore(
      gql`
        ${printSchema(schema)}
      `,
      path,
      outputAs,
    );
    await tsFile.save();
    console.log(
      `[${new Date().toLocaleTimeString()}] The definitions have been updated.`,
    );
  }
}
