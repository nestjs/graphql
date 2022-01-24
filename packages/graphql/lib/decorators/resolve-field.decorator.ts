import { SetMetadata, Type } from '@nestjs/common';
import { isFunction, isObject } from '@nestjs/common/utils/shared.utils';
import {
  FIELD_RESOLVER_MIDDLEWARE_METADATA,
  RESOLVER_NAME_METADATA,
  RESOLVER_PROPERTY_METADATA,
} from '../graphql.constants';
import { Complexity, FieldMiddleware } from '../interfaces';
import { BaseTypeOptions } from '../interfaces/base-type-options.interface';
import {
  GqlTypeReference,
  ReturnTypeFunc,
} from '../interfaces/return-type-func.interface';
import { TypeOptions } from '../interfaces/type-options.interface';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import { reflectTypeFromMetadata } from '../utils/reflection.utilts';

/**
 * Interface defining options that can be passed to `@ResolveField()` decorator.
 */
export interface ResolveFieldOptions extends BaseTypeOptions {
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
}

/**
 * Field resolver (method) Decorator.
 */
export function ResolveField(
  typeFunc?: ReturnTypeFunc,
  options?: ResolveFieldOptions,
): MethodDecorator;
/**
 * Property resolver (method) Decorator.
 */
export function ResolveField(
  propertyName?: string,
  typeFunc?: ReturnTypeFunc,
  options?: ResolveFieldOptions,
): MethodDecorator;
/**
 * Property resolver (method) Decorator.
 */
export function ResolveField(
  propertyNameOrFunc?: string | ReturnTypeFunc,
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
      ? typeFuncOrOptions && typeFuncOrOptions.name
        ? [typeFuncOrOptions.name, propertyNameOrFunc, typeFuncOrOptions]
        : [undefined, propertyNameOrFunc, typeFuncOrOptions]
      : [propertyNameOrFunc, typeFuncOrOptions, resolveFieldOptions];

    SetMetadata(RESOLVER_NAME_METADATA, propertyName)(target, key, descriptor);
    SetMetadata(RESOLVER_PROPERTY_METADATA, true)(target, key, descriptor);
    SetMetadata(
      FIELD_RESOLVER_MIDDLEWARE_METADATA,
      (options as ResolveFieldOptions)?.middleware,
    )(target, key, descriptor);

    options = isObject(options)
      ? {
          name: propertyName as string,
          ...options,
        }
      : propertyName
      ? { name: propertyName as string }
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
      } catch {}

      TypeMetadataStorage.addResolverPropertyMetadata({
        kind: 'external',
        methodName: key,
        schemaName: options.name || key,
        target: target.constructor,
        typeFn,
        typeOptions,
        description: (options as ResolveFieldOptions).description,
        deprecationReason: (options as ResolveFieldOptions).deprecationReason,
        complexity: (options as ResolveFieldOptions).complexity,
      });
    });
  };
}
