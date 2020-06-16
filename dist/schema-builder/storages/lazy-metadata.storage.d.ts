import { Type } from '@nestjs/common';
export declare class LazyMetadataStorageHost {
  private readonly storage;
  store(func: Function): void;
  store(target: Type<unknown>, func: Function): void;
  load(types?: Function[]): void;
  private concatPrototypes;
}
export declare const LazyMetadataStorage: LazyMetadataStorageHost;
