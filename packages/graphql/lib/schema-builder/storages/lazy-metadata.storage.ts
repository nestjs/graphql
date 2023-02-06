import { flatten, Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';

const NO_TARGET_METADATA = Symbol('NO_TARGET_METADATA');
const FIELD_LAZY_METADATA = Symbol('FIELD_LAZY_METADATA');

export class LazyMetadataStorageHost {
  private readonly lazyMetadataByTarget = new Map<
    Type<unknown> | symbol,
    Function[]
  >();

  store(func: Function): void;
  store(target: Type<unknown>, func: Function): void;
  store(
    target: Type<unknown>,
    func: Function,
    options?: { isField: boolean },
  ): void;
  store(
    targetOrFn: Type<unknown> | Function,
    func?: Function,
    options?: { isField: boolean },
  ) {
    if (func && options?.isField) {
      this.updateStorage(FIELD_LAZY_METADATA, func);
      this.updateStorage(targetOrFn as Type<unknown>, func);
    } else if (func) {
      this.updateStorage(targetOrFn as Type<unknown>, func);
    } else {
      this.updateStorage(NO_TARGET_METADATA, targetOrFn);
    }
  }

  load(
    types: Function[] = [],
    options: {
      skipFieldLazyMetadata?: boolean;
    } = {
      skipFieldLazyMetadata: false,
    },
  ) {
    types = this.concatPrototypes(types);

    let loadersToExecute = flatten(
      types
        .map((target) => this.lazyMetadataByTarget.get(target as Type<unknown>))
        .filter((metadata) => metadata),
    );

    loadersToExecute = [
      loadersToExecute,
      this.lazyMetadataByTarget.get(NO_TARGET_METADATA) || [],
    ].flat();

    if (!options.skipFieldLazyMetadata) {
      loadersToExecute = [
        loadersToExecute,
        this.lazyMetadataByTarget.get(FIELD_LAZY_METADATA) || [],
      ].flat();
    }
    loadersToExecute.forEach((func) => func());
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

  private updateStorage(key: symbol | Type<unknown>, func: Function) {
    const existingArray = this.lazyMetadataByTarget.get(key);
    let called = false;
    const singleCallFunctionWrapper = () => {
      if (called) return;
      func();
      called = true;
    };
    if (existingArray) {
      existingArray.push(singleCallFunctionWrapper);
    } else {
      this.lazyMetadataByTarget.set(key, [singleCallFunctionWrapper]);
    }
  }
}

const globalRef = global as any;
export const LazyMetadataStorage: LazyMetadataStorageHost =
  globalRef.GqlLazyMetadataStorageHost ||
  (globalRef.GqlLazyMetadataStorageHost = new LazyMetadataStorageHost());
