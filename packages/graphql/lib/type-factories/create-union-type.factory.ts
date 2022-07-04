/**
 * The API surface of this module has been heavily inspired by the "type-graphql" library (https://github.com/MichalLytek/type-graphql), originally designed & released by Michal Lytek.
 * In the v6 major release of NestJS, we introduced the code-first approach as a compatibility layer between this package and the `@nestjs/graphql` module.
 * Eventually, our team decided to reimplement all the features from scratch due to a lack of flexibility.
 * To avoid numerous breaking changes, the public API is backward-compatible and may resemble "type-graphql".
 */

import { Type } from '@nestjs/common';
import { ResolveTypeFn } from '../interfaces/resolve-type-fn.interface';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';

/**
 * Interface defining options that can be passed to `createUnionType` function.
 */
export interface UnionOptions<T extends readonly Type<unknown>[] = Type<unknown>[]> {
  /**
   * Name of the union.
   */
  name?: string;
  /**
   * Description of the union.
   */
  description?: string;
  /**
   * Custom implementation of the "resolveType" function.
   */
  resolveType?: ResolveTypeFn<any, any>;
  /**
   * Types that the union consist of.
   */
  types: () => T;
}

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType[number];
export type Union<T extends readonly any[]> = InstanceType<ArrayElement<T>>;

/**
 * Creates a GraphQL union type composed of types references.
 * @param options
 */
export function createUnionType<T extends readonly Type<unknown>[] = Type<unknown>[]>(
  options: UnionOptions<T>,
): Union<T> {
  const { name, description, types, resolveType } = options;
  const id = Symbol(name);

  LazyMetadataStorage.store(() =>
    TypeMetadataStorage.addUnionMetadata({
      id,
      name,
      description,
      typesFn: types,
      resolveType,
    }),
  );
  return id as any;
}
