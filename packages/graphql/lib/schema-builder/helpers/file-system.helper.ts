import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { join, parse, resolve, sep } from 'path';

@Injectable()
export class FileSystemHelper {
  async writeFile(path: string, content: string) {
    try {
      await fs.promises.writeFile(path, content);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      await this.mkdirRecursive(path);
      await fs.promises.writeFile(path, content);
    }
  }

  async mkdirRecursive(path: string) {
    for (const dir of this.getDirs(path)) {
      try {
        await fs.promises.mkdir(dir);
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
      }
    }
  }

  getDirs(path: string): string[] {
    const parsedPath = parse(resolve(path));
    const chunks = parsedPath.dir.split(sep);
    if (parsedPath.root === '/') {
      chunks[0] = `/${chunks[0]}`;
    }
    const dirs = new Array<string>();
    chunks.reduce((previous: string, next: string) => {
      const directory = join(previous, next);
      dirs.push(directory);
      return join(directory);
    });
    return dirs;
  }
}
