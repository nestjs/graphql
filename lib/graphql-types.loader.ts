import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as glob from 'glob';
import { flatten } from 'lodash';
import { mergeTypes } from 'merge-graphql-schemas';

@Injectable()
export class GraphQLTypesLoader {
  mergeTypesByPaths(...pathsToTypes: string[]): string {
    return mergeTypes(
      flatten(pathsToTypes.map(pattern => this.loadFiles(pattern))),
      { all: true },
    );
  }

  private loadFiles(pattern: string): any[] {
    const paths = glob.sync(pattern);
    return paths.map(path => fs.readFileSync(path, 'utf8'));
  }
}
