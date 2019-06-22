import { Injectable } from '@nestjs/common';
import * as glob from 'fast-glob';
import * as fs from 'fs';
import { flatten } from 'lodash';
import { mergeTypes } from 'merge-graphql-schemas';
import * as util from 'util';
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
    return mergeTypes(flatTypes, { all: true }) as any;
  }

  async getTypesFromPaths(paths: string | string[]): Promise<string[]> {
    paths = util.isArray(paths)
      ? paths.map(path => normalize(path))
      : normalize(paths);

    const filePaths = await glob(paths, {
      ignore: ['node_modules'],
    });
    const fileContentsPromises = filePaths.sort().map(filePath => {
      return readFile(filePath.toString(), 'utf8');
    });

    return Promise.all(fileContentsPromises);
  }
}
