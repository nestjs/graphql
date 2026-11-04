import { SetMetadata, Type } from '@nestjs/common';
import { ENTRY_PROVIDER_WATERMARK } from '@nestjs/common/constants.js';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils.js';
import 'reflect-metadata';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage.js';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage.js';
import { RESOLVER_TYPE_REFERENCE_METADATA } from '../utils/extract-metadata.util.js';
import {
  addResolverMetadata,
  getClassName,
  getClassOrUndefined,
  getResolverTypeFn,
} from './resolvers.utils.js';

export type ResolverTypeFn = (of?: void) => Function;

/**
 * Extracts the name property set through the @ObjectType() decorator (if specified)
 * @param nameOrType type reference
 *
 * @publicApi
 */
function getObjectOrInterfaceTypeNameIfExists(
  nameOrType: Function,
): string | undefined {
  const ctor = getClassOrUndefined(nameOrType);
  const objectMetadata =
    TypeMetadataStorage.getObjectTypeMetadataByTarget(ctor);
  if (!objectMetadata) {
    const interfaceMetadata =
      TypeMetadataStorage.getInterfaceMetadataByTarget(ctor);
    if (!interfaceMetadata) {
      return;
    }
    return interfaceMetadata.name;
  }
  return objectMetadata.name;
}

/**
 * Interface defining options that can be passed to `@Resolve()` decorator
 *
 * @publicApi
 */
export interface ResolverOptions {
  /**
   * If `true`, type will not be registered in the schema.
   */
  isAbstract?: boolean;
}

/**
 * Object resolver decorator.
 *
 * @publicApi
 */
export function Resolver(): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 *
 * @publicApi
 */
export function Resolver(name: string): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 *
 * @publicApi
 */
export function Resolver(
  options: ResolverOptions,
): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 *
 * @publicApi
 */
export function Resolver(
  classType: Function,
  options?: ResolverOptions,
): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 *
 * @publicApi
 */
export function Resolver(
  typeFunc: ResolverTypeFn,
  options?: ResolverOptions,
): MethodDecorator & ClassDecorator;
/**
 * Object resolver decorator.
 *
 * @publicApi
 */
export function Resolver(
  nameOrTypeOrOptions?:
    | string
    | ResolverTypeFn
    | Type<any>
    | Function
    | ResolverOptions,
  options?: ResolverOptions,
): MethodDecorator & ClassDecorator {
  return (
    target: object | Function,
    key?: string | symbol,
    descriptor?: any,
  ) => {
    // On a method, mark the class that declares it: Nest binds the request
    // or transient-scoped global enhancers to entry providers only
    SetMetadata(
      ENTRY_PROVIDER_WATERMARK,
      true,
    )(typeof target === 'function' ? target : target.constructor);

    const [nameOrType, resolverOptions] =
      typeof nameOrTypeOrOptions === 'object' && nameOrTypeOrOptions !== null
        ? [undefined, nameOrTypeOrOptions]
        : [nameOrTypeOrOptions as string | ResolverTypeFn | Type<any>, options];

    let name = nameOrType && getClassName(nameOrType);

    if (isFunction(nameOrType)) {
      const objectName = getObjectOrInterfaceTypeNameIfExists(
        nameOrType as Function,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      objectName && (name = objectName);
    }
    if (name) {
      // Without a type, the one inherited from a parent resolver class (if
      // any) must remain in effect rather than be shadowed by "undefined"
      addResolverMetadata(undefined, name, target, key, descriptor);
      SetMetadata(RESOLVER_TYPE_REFERENCE_METADATA, isFunction(nameOrType))(
        target,
        key,
        descriptor,
      );
    }

    if (!isString(nameOrType)) {
      LazyMetadataStorage.store(target as Type<unknown>, () => {
        const typeFn = getResolverTypeFn(nameOrType, target as Function);

        TypeMetadataStorage.addResolverMetadata({
          target: target as Function,
          typeFn: typeFn,
          isAbstract: (resolverOptions && resolverOptions.isAbstract) || false,
        });
      });
    }
  };
}
