/**
 * The API surface of this module has been heavily inspired by the "type-graphql" library (https://github.com/MichalLytek/type-graphql), originally designed & released by Michal Lytek.
 * In the v6 major release of NestJS, we introduced the code-first approach as a compatibility layer between this package and the `@nestjs/graphql` module.
 * Eventually, our team decided to reimplement all the features from scratch due to a lack of flexibility.
 * To avoid numerous breaking changes, the public API is backward-compatible and may resemble "type-graphql".
 */

import { isFunction } from '@nestjs/common/utils/shared.utils';
import { BaseTypeOptions } from '../interfaces/base-type-options.interface';
import { ReturnTypeFunc } from '../interfaces/return-type-func.interface';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import { reflectTypeFromMetadata } from '../utils/reflection.utilts';

/**
 * Interface defining options that can be passed to `@InputType()` decorator.
 */
export interface FieldOptions extends BaseTypeOptions {
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
}

/**
 * @Field() decorator is used to mark a specific class property as a GraphQL field.
 * Only properties decorated with this decorator will be defined in the schema.
 */
export function Field(): PropertyDecorator & MethodDecorator;
/**
 * @Field() decorator is used to mark a specific class property as a GraphQL field.
 * Only properties decorated with this decorator will be defined in the schema.
 */
export function Field(
  options: FieldOptions,
): PropertyDecorator & MethodDecorator;
/**
 * @Field() decorator is used to mark a specific class property as a GraphQL field.
 * Only properties decorated with this decorator will be defined in the schema.
 */
export function Field(
  returnTypeFunction?: ReturnTypeFunc,
  options?: FieldOptions,
): PropertyDecorator & MethodDecorator;
/**
 * @Field() decorator is used to mark a specific class property as a GraphQL field.
 * Only properties decorated with this decorator will be defined in the schema.
 */
export function Field(
  typeOrOptions?: ReturnTypeFunc | FieldOptions,
  fieldOptions?: FieldOptions,
): PropertyDecorator & MethodDecorator {
  return (
    prototype: Object,
    propertyKey?: string,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    const [typeFunc, options = {}] = isFunction(typeOrOptions)
      ? [typeOrOptions, fieldOptions]
      : [undefined, typeOrOptions as any];

    const isResolver = !!descriptor;
    const isResolverMethod = !!(descriptor && descriptor.value);

    const { typeFn: getType, options: typeOptions } = reflectTypeFromMetadata({
      metadataKey: isResolverMethod ? 'design:returntype' : 'design:type',
      prototype,
      propertyKey,
      explicitTypeFn: typeFunc as ReturnTypeFunc,
      typeOptions: options,
    });

    TypeMetadataStorage.addClassFieldMetadata({
      name: propertyKey,
      schemaName: options.name || propertyKey,
      typeFn: getType,
      options: typeOptions,
      target: prototype.constructor,
      description: options.description,
      deprecationReason: options.deprecationReason,
    });

    if (isResolver) {
      TypeMetadataStorage.addResolverPropertyMetadata({
        kind: 'internal',
        methodName: propertyKey,
        schemaName: options.name || propertyKey,
        target: prototype.constructor,
      });
    }
  };
}
