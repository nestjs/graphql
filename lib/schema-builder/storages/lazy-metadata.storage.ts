import { flatten, Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';

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
    types = this.concatPrototypes(types);
    this.storage.forEach(({ func, target }) => {
      if (target && types.includes(target)) {
        func();
      } else if (!target) {
        func();
      }
    });
  }

  private concatPrototypes(types: Function[]): Function[] {
    const typesWithPrototypes = types
      .filter((type) => type && type.prototype)
      .map((type) => {
        const parentTypes = [];

        let parent: Function = type;
        while (!isUndefined(parent.prototype)) {
          parent = Object.getPrototypeOf(parent);
          if (parent === Function.prototype) {
            break;
          }
          parentTypes.push(parent);
        }
        parentTypes.push(type);
        return parentTypes;
      });

    return flatten(typesWithPrototypes);
  }
}

const globalRef = global as any;
export const LazyMetadataStorage: LazyMetadataStorageHost =
  globalRef.GqlLazyMetadataStorageHost ||
  (globalRef.GqlLazyMetadataStorageHost = new LazyMetadataStorageHost());
