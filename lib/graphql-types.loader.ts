import { mergeTypeDefs } from '@graphql-tools/merge';
import { Injectable } from '@nestjs/common';
import * as glob from 'fast-glob';
import * as fs from 'fs';
import { flatten } from 'lodash';
import * as util from 'util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const normalize = require('normalize-path');
const readFile = util.promisify(fs.readFile);

@Injectable()
export class GraphQLTypesLoader {
  async mergeTypesByPaths(paths: string | string[]): Promise<string> {
    if (!paths || paths.length === 0) {
      return null;
    }
    const types = await this.getTypesFromPaths(paths);
    const flatTypes = flatten(types);

    return mergeTypeDefs(flatTypes, {
      throwOnConflict: true,
      commentDescriptions: true,
      reverseDirectives: true,
    });
  }

  private async getTypesFromPaths(paths: string | string[]): Promise<string[]> {
    paths = util.isArray(paths)
      ? paths.map((path) => normalize(path))
      : normalize(paths);

    const filePaths = await glob(paths, {
      ignore: ['node_modules'],
    });
    if (filePaths.length === 0) {
      throw new Error(
        `No type definitions were found with the specified file name patterns: "${paths}". Please make sure there is at least one file that matches the given patterns.`,
      );
    }
    const fileContentsPromises = filePaths.sort().map((filePath) => {
      return readFile(filePath.toString(), 'utf8');
    });

    return Promise.all(fileContentsPromises);
  }
}
