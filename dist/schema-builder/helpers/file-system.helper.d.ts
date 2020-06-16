export declare class FileSystemHelper {
  writeFile(path: string, content: string): Promise<void>;
  mkdirRecursive(path: string): Promise<void>;
  getDirs(path: string): string[];
}
