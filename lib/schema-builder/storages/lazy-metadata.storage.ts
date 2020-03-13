import { Type } from '@nestjs/common';

interface LazyMetadataHost {
  func: Function;
  target?: Type<unknown>;
}

export class LazyMetadataStorageHost {
  private readonly storage = new Array<LazyMetadataHost>();

  store(func: Function): void;
  store(target: Type<unknown>, func: Function): void;
  store(targetOrFn: Type<unknown> | Function, func?: Function) {
    if (func) {
      this.storage.push({ target: targetOrFn as Type<unknown>, func });
    } else {
      this.storage.push({ func: targetOrFn });
    }
  }

  load(types: Function[] = []) {
    this.storage.forEach(({ func, target }) => {
      if (target && types.includes(target)) {
        func();
      } else if (!target) {
        func();
      }
    });
  }
}

export const LazyMetadataStorage = new LazyMetadataStorageHost();
