/**
 * The API surface of this module has been heavily inspired by the "type-graphql" library (https://github.com/MichalLytek/type-graphql), originally designed & released by Michal Lytek.
 * In the v6 major release of NestJS, we introduced the code-first approach as a compatibility layer between this package and the `@nestjs/graphql` module.
 * Eventually, our team decided to reimplement all the features from scratch due to a lack of flexibility.
 * To avoid numerous breaking changes, the public API is backward-compatible and may resemble "type-graphql".
 */

import { isString } from '@nestjs/common/utils/shared.utils';
import { ClassType } from '../enums/class-type.enum';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import { addClassTypeMetadata } from '../utils/add-class-type-metadata.util';

/**
 * Interface defining options that can be passed to `@ObjectType()` decorator
 */
export interface ObjectTypeOptions {
  /**
   * Description of the input type.
   */
  description?: string;
  /**
   * If `true`, type will not be registered in the schema.
   */
  isAbstract?: boolean;
  /**
   * Interfaces implemented by this object type.
   */
  implements?: Function | Function[] | (() => Function | Function[]);
}

/**
 * Decorator that marks a class as a GraphQL type.
 */
export function ObjectType(): ClassDecorator;
/**
 * Decorator that marks a class as a GraphQL type.
 */
export function ObjectType(options: ObjectTypeOptions): ClassDecorator;
/**
 * Decorator that marks a class as a GraphQL type.
 */
export function ObjectType(
  name: string,
  options?: ObjectTypeOptions,
): ClassDecorator;
/**
 * Decorator that marks a class as a GraphQL type.
 */
export function ObjectType(
  nameOrOptions?: string | ObjectTypeOptions,
  objectTypeOptions?: ObjectTypeOptions,
): ClassDecorator {
  const [name, options = {}] = isString(nameOrOptions)
    ? [nameOrOptions, objectTypeOptions]
    : [undefined, nameOrOptions];

  return (target) => {
    const addObjectTypeMetadata = () =>
      TypeMetadataStorage.addObjectTypeMetadata({
        name: name || target.name,
        target,
        description: options.description,
        interfaces: options.implements,
        isAbstract: options.isAbstract,
      });

    // This function must be called eagerly to allow resolvers
    // accessing the "name" property
    addObjectTypeMetadata();
    LazyMetadataStorage.store(addObjectTypeMetadata);

    addClassTypeMetadata(target, ClassType.OBJECT);
  };
}
