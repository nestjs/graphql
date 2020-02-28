import { Type } from '@nestjs/common';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils';
import 'reflect-metadata';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import {
  addResolverMetadata,
  getClassName,
  getClassOrUndefined,
} from './resolvers.utils';

export type ResolverTypeFn = (of?: void) => Type<any>;

/**
 * Interface defining options that can be passed to `@Resolve()` decorator
 */
export interface ResolverOptions {
  /**
   * If `true`, type will not be registered in the schema.
   */
  isAbstract?: boolean;
}

/**
 * Object resolver decorator.
 */
export function Resolver(): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 */
export function Resolver(name: string): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 */
export function Resolver(
  classType: Type<any>,
  options?: ResolverOptions,
): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 */
export function Resolver(
  typeFunc: ResolverTypeFn,
  options?: ResolverOptions,
): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 */
export function Resolver(
  nameOrType?: string | ResolverTypeFn | Type<any>,
  options?: ResolverOptions,
): MethodDecorator & ClassDecorator {
  return (
    target: Object | Function,
    key?: string | symbol,
    descriptor?: any,
  ) => {
    let name = nameOrType && getClassName(nameOrType);

    if (isFunction(nameOrType)) {
      // extract name from @ObjectType()
      const ctor = getClassOrUndefined(nameOrType as Function);
      const objectTypesMetadata = TypeMetadataStorage.getObjectTypesMetadata();
      const objectMetadata = objectTypesMetadata.find(
        type => type.target === ctor,
      );
      objectMetadata && (name = objectMetadata.name);
    }
    addResolverMetadata(undefined, name, target, key, descriptor);

    if (!isString(nameOrType)) {
      LazyMetadataStorage.store(() => {
        const getObjectType = nameOrType
          ? nameOrType.prototype
            ? () => nameOrType as Type<unknown>
            : (nameOrType as ResolverTypeFn)
          : () => {
              throw new Error(
                `No provided object type in '@Resolver' decorator for class '${
                  (target as Function).name
                }!'`,
              );
            };
        TypeMetadataStorage.addResolverMetadata({
          target: target as Function,
          typeFn: getObjectType,
          isAbstract: (options && options.isAbstract) || false,
        });
      });
    }
  };
}
