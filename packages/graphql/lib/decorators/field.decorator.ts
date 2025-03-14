/**
 * The API surface of this module has been heavily inspired by the "type-graphql" library (https://github.com/MichalLytek/type-graphql), originally designed & released by Michal Lytek.
 * In the v6 major release of NestJS, we introduced the code-first approach as a compatibility layer between this package and the `@nestjs/graphql` module.
 * Eventually, our team decided to reimplement all the features from scratch due to a lack of flexibility.
 * To avoid numerous breaking changes, the public API is backward-compatible and may resemble "type-graphql".
 */

import { Type } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { Complexity, FieldMiddleware } from '../interfaces';
import { BaseTypeOptions } from '../interfaces/base-type-options.interface';
import {
  GqlTypeReference,
  ReturnTypeFunc,
  ReturnTypeFuncValue,
} from '../interfaces/return-type-func.interface';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import { reflectTypeFromMetadata } from '../utils/reflection.utilts';

/**
 * Interface defining options that can be passed to `@Field()` decorator.
 *
 * @publicApi
 */
export type FieldOptions<T = any> = BaseTypeOptions<T> & {
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

type FieldOptionsExtractor<T> = T extends [GqlTypeReference<infer P>]
  ? FieldOptions<P[]>
  : T extends GqlTypeReference<infer P>
    ? FieldOptions<P>
    : never;

/**
 * @Field() decorator is used to mark a specific class property as a GraphQL field.
 * Only properties decorated with this decorator will be defined in the schema.
 *
 * @publicApi
 */
export function Field(): PropertyDecorator & MethodDecorator;
/**
 * @Field() decorator is used to mark a specific class property as a GraphQL field.
 * Only properties decorated with this decorator will be defined in the schema.
 *
 * @publicApi
 */
export function Field<T extends ReturnTypeFuncValue>(
  options: FieldOptionsExtractor<T>,
): PropertyDecorator & MethodDecorator;
/**
 * @Field() decorator is used to mark a specific class property as a GraphQL field.
 * Only properties decorated with this decorator will be defined in the schema.
 *
 * @publicApi
 */
export function Field<T extends ReturnTypeFuncValue>(
  returnTypeFunction?: ReturnTypeFunc<T>,
  options?: FieldOptionsExtractor<T>,
): PropertyDecorator & MethodDecorator;

/**
 * @Field() decorator is used to mark a specific class property as a GraphQL field.
 * Only properties decorated with this decorator will be defined in the schema.
 *
 * @publicApi
 */
export function Field<T extends ReturnTypeFuncValue>(
  typeOrOptions?: ReturnTypeFunc<T> | FieldOptionsExtractor<T>,
  fieldOptions?: FieldOptionsExtractor<T>,
): PropertyDecorator & MethodDecorator {
  return (
    prototype: object,
    propertyKey?: string,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    addFieldMetadata(
      typeOrOptions,
      fieldOptions,
      prototype,
      propertyKey,
      descriptor,
    );
  };
}

export function addFieldMetadata<T extends ReturnTypeFuncValue>(
  typeOrOptions: ReturnTypeFunc<T> | FieldOptionsExtractor<T>,
  fieldOptions: FieldOptionsExtractor<T>,
  prototype: object,
  propertyKey?: string,
  descriptor?: TypedPropertyDescriptor<any>,
  loadEagerly?: boolean,
) {
  const [typeFunc, options = {}] = isFunction(typeOrOptions)
    ? [typeOrOptions, fieldOptions]
    : [undefined, typeOrOptions as any];

  const applyMetadataFn = () => {
    const isResolver = !!descriptor;
    const isResolverMethod = !!(descriptor && descriptor.value);

    const { typeFn: getType, options: typeOptions } = reflectTypeFromMetadata({
      metadataKey: isResolverMethod ? 'design:returntype' : 'design:type',
      prototype,
      propertyKey,
      explicitTypeFn: typeFunc,
      typeOptions: options,
      ignoreOnUndefinedType: loadEagerly,
    });

    TypeMetadataStorage.addClassFieldMetadata({
      name: propertyKey,
      schemaName: options.name || propertyKey,
      typeFn: getType,
      options: typeOptions,
      target: prototype.constructor,
      description: options.description,
      deprecationReason: options.deprecationReason,
      complexity: options.complexity,
      middleware: options.middleware,
    });

    if (isResolver) {
      TypeMetadataStorage.addResolverPropertyMetadata({
        kind: 'internal',
        methodName: propertyKey,
        schemaName: options.name || propertyKey,
        target: prototype.constructor,
        complexity: options.complexity,
      });
    }
  };
  if (loadEagerly) {
    applyMetadataFn();
  } else {
    LazyMetadataStorage.store(
      prototype.constructor as Type<unknown>,
      applyMetadataFn,
      { isField: true },
    );
  }
}
