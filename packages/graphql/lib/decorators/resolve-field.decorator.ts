import { SetMetadata, Type } from '@nestjs/common';
import {
  isFunction,
  isObject,
  isString,
} from '@nestjs/common/utils/shared.utils.js';
import {
  FIELD_RESOLVER_MIDDLEWARE_METADATA,
  RESOLVER_NAME_METADATA,
  RESOLVER_PROPERTY_METADATA,
} from '../graphql.constants.js';
import { Complexity, FieldMiddleware } from '../interfaces/index.js';
import { BaseTypeOptions } from '../interfaces/base-type-options.interface.js';
import {
  GqlTypeReference,
  ReturnTypeFunc,
} from '../interfaces/return-type-func.interface.js';
import { TypeOptions } from '../interfaces/type-options.interface.js';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage.js';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage.js';
import { reflectTypeFromMetadata } from '../utils/reflection.utilts.js';

/**
 * Interface defining options that can be passed to `@ResolveField()` decorator.
 *
 * @publicApi
 */
export type ResolveFieldOptions<T = any> = BaseTypeOptions<T> & {
  /**
   * Name of the field.
   */
  name?: string;
  /**
   * Description of the field.
   */
  description?: string;
  /**
   * Field deprecation reason (if deprecated).
   */
  deprecationReason?: string;
  /**
   * Field complexity options.
   */
  complexity?: Complexity;
  /**
   * Array of middleware to apply.
   */
  middleware?: FieldMiddleware[];
};

/**
 * Field resolver (method) Decorator.
 *
 * @publicApi
 */
export function ResolveField(options?: ResolveFieldOptions): MethodDecorator;
/**
 * Property resolver (method) Decorator.
 *
 * @publicApi
 */
export function ResolveField(
  typeFunc?: ReturnTypeFunc,
  options?: ResolveFieldOptions,
): MethodDecorator;
/**
 * Property resolver (method) Decorator.
 *
 * @publicApi
 */
export function ResolveField(
  propertyName?: string,
  options?: ResolveFieldOptions,
): MethodDecorator;
/**
 * Property resolver (method) Decorator.
 *
 * @publicApi
 */
export function ResolveField(
  propertyName?: string,
  typeFunc?: ReturnTypeFunc,
  options?: ResolveFieldOptions,
): MethodDecorator;
/**
 * Property resolver (method) Decorator.
 *
 * @publicApi
 */
export function ResolveField(
  propertyNameOrFunc?: string | ReturnTypeFunc | ResolveFieldOptions,
  typeFuncOrOptions?: ReturnTypeFunc | ResolveFieldOptions,
  resolveFieldOptions?: ResolveFieldOptions,
): MethodDecorator {
  return (
    target: Function | Record<string, any>,
    key?: string,
    descriptor?: any,
  ) => {
    // eslint-disable-next-line prefer-const
    let [propertyName, typeFunc, options] = isFunction(propertyNameOrFunc)
      ? typeFuncOrOptions && (typeFuncOrOptions as ResolveFieldOptions).name
        ? [
            (typeFuncOrOptions as ResolveFieldOptions).name,
            propertyNameOrFunc,
            typeFuncOrOptions,
          ]
        : [undefined, propertyNameOrFunc, typeFuncOrOptions]
      : isString(propertyNameOrFunc)
      ? isFunction(typeFuncOrOptions)
        ? [propertyNameOrFunc, typeFuncOrOptions, resolveFieldOptions]
        : [propertyNameOrFunc, undefined, typeFuncOrOptions]
      : [undefined, undefined, propertyNameOrFunc];

    SetMetadata(RESOLVER_NAME_METADATA, propertyName)(target, key, descriptor);
    SetMetadata(RESOLVER_PROPERTY_METADATA, true)(target, key, descriptor);
    SetMetadata(
      FIELD_RESOLVER_MIDDLEWARE_METADATA,
      (options as ResolveFieldOptions)?.middleware,
    )(target, key, descriptor);

    options = isObject(options)
      ? {
          name: propertyName,
          ...options,
        }
      : propertyName
      ? { name: propertyName }
      : {};

    LazyMetadataStorage.store(target.constructor as Type<unknown>, () => {
      let typeOptions: TypeOptions, typeFn: (type?: any) => GqlTypeReference;
      try {
        const implicitTypeMetadata = reflectTypeFromMetadata({
          metadataKey: 'design:returntype',
          prototype: target,
          propertyKey: key,
          explicitTypeFn: typeFunc as ReturnTypeFunc,
          typeOptions: options as any,
        });
        typeOptions = implicitTypeMetadata.options;
        typeFn = implicitTypeMetadata.typeFn;
      } catch {
        /* empty */
      }

      TypeMetadataStorage.addResolverPropertyMetadata({
        kind: 'external',
        methodName: key,
        schemaName: options.name || key,
        target: target.constructor,
        typeFn,
        typeOptions,
        description: options.description,
        deprecationReason: options.deprecationReason,
        complexity: options.complexity,
      });
    });
  };
}
