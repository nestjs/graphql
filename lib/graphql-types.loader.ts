import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as glob from 'glob';
import { flatten } from 'lodash';
import { mergeTypes } from 'merge-graphql-schemas';

@Injectable()
export class GraphQLTypesLoader {
  mergeTypesByPaths(...pathsToTypes: string[]): string {
    /** Temporary workaround: https://github.com/okgrow/merge-graphql-schemas/issues/155 */
    return mergeTypes(
      flatten(pathsToTypes.map(pattern => this.loadFiles(pattern))).concat(
        `type Query { temp__: Boolean }`,
      ),
      { all: true },
    );
  }

  private loadFiles(pattern: string): any[] {
    const paths = glob.sync(pattern);
    return paths.map(path => fs.readFileSync(path, 'utf8'));
  }
}
