/**
 * The API surface of this module has been heavily inspired by the "type-graphql" library (https://github.com/MichalLytek/type-graphql), originally designed & released by Michal Lytek.
 * In the v6 major release of NestJS, we introduced the code-first approach as a compatibility layer between this package and the `@nestjs/graphql` module.
 * Eventually, our team decided to reimplement all the features from scratch due to a lack of flexibility.
 * To avoid numerous breaking changes, the public API is backward-compatible and may resemble "type-graphql".
 */

import {
  EnumMetadataValuesMap,
  RegisterInOption,
} from '../schema-builder/metadata/index.js';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage.js';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage.js';

/**
 * Interface defining options that can be passed to `registerEnumType` function.
 */
export interface EnumOptions<T extends object = any> {
  /**
   * Name of the enum.
   */
  name: string;
  /**
   * Description of the enum.
   */
  description?: string;
  /**
   * A map of options for the values of the enum.
   */
  valuesMap?: EnumMetadataValuesMap<T>;
  /**
   * NestJS module that this enum belongs to.
   * When specified, this enum will only be included in GraphQL schemas
   * that include this module via the `include` option.
   * @see RegisterInOption for details
   */
  registerIn?: RegisterInOption;
  /**
   * An array of directive SDL strings (e.g. `['@tag(name: "internal")']`) to be
   * applied on the generated enum type.
   */
  directives?: string[];
}

/**
 * Registers a GraphqQL enum type based on the passed enumerator reference.
 * @param options
 */
export function registerEnumType<T extends object = any>(
  enumRef: T,
  options?: EnumOptions<T>,
) {
  if (!options || typeof options.name !== 'string' || options.name === '') {
    throw new Error(
      `registerEnumType requires an "options" object with a non-empty "name" (e.g. registerEnumType(MyEnum, { name: 'MyEnum' })).`,
    );
  }
  LazyMetadataStorage.store(() =>
    TypeMetadataStorage.addEnumMetadata({
      ref: enumRef,
      name: options.name,
      description: options.description,
      valuesMap: options.valuesMap || {},
      registerIn: options.registerIn,
      directives: options.directives,
    }),
  );
}
