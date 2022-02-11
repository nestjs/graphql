/**
 * The API surface of this module has been heavily inspired by the "type-graphql" library (https://github.com/MichalLytek/type-graphql), originally designed & released by Michal Lytek.
 * In the v6 major release of NestJS, we introduced the code-first approach as a compatibility layer between this package and the `@nestjs/graphql` module.
 * Eventually, our team decided to reimplement all the features from scratch due to a lack of flexibility.
 * To avoid numerous breaking changes, the public API is backward-compatible and may resemble "type-graphql".
 */

import { isString } from '@nestjs/common/utils/shared.utils';
import { ClassType } from '../enums/class-type.enum';
import { ResolveTypeFn } from '../interfaces';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import { addClassTypeMetadata } from '../utils/add-class-type-metadata.util';

/**
 * Interface defining options that can be passed to `@InterfaceType()` decorator.
 */
export interface InterfaceTypeOptions {
  /**
   * Description of the argument.
   */
  description?: string;
  /**
   * If `true`, type will not be registered in the schema.
   */
  isAbstract?: boolean;
  /**
   * Custom implementation of the "resolveType" function.
   */
  resolveType?: ResolveTypeFn<any, any>;
  /**
   * Interfaces implemented by this interface.
   */
  implements?: Function | Function[] | (() => Function | Function[]);
}

/**
 * Decorator that marks a class as a GraphQL interface type.
 */
export function InterfaceType(options?: InterfaceTypeOptions): ClassDecorator;
/**
 * Decorator that marks a class as a GraphQL interface type.
 */
export function InterfaceType(
  name: string,
  options?: InterfaceTypeOptions,
): ClassDecorator;
/**
 * Decorator that marks a class as a GraphQL interface type.
 */
export function InterfaceType(
  nameOrOptions?: string | InterfaceTypeOptions,
  interfaceOptions?: InterfaceTypeOptions,
): ClassDecorator {
  const [name, options = {}] = isString(nameOrOptions)
    ? [nameOrOptions, interfaceOptions]
    : [undefined, nameOrOptions];

  return (target) => {
    const addInterfaceMetadata = () => {
      const metadata = {
        name: name || target.name,
        target,
        ...options,
        interfaces: options.implements,
      };
      TypeMetadataStorage.addInterfaceMetadata(metadata);
    };

    // This function must be called eagerly to allow resolvers
    // accessing the "name" property
    addInterfaceMetadata();

    LazyMetadataStorage.store(() => addInterfaceMetadata());

    addClassTypeMetadata(target, ClassType.INTERFACE);
  };
}
