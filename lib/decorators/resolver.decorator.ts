import { Type } from '@nestjs/common';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils';
import { lazyMetadataStorage } from '../storages/lazy-metadata.storage';
import {
  ClassTypeResolver,
  ResolverClassOptions,
} from './../external/type-graphql.types';
import {
  addResolverMetadata,
  getClassName,
  getClassOrUndefined,
} from './resolvers.utils';

let TypeGqlResolver: Function;
let getMetadataStorage: Function;
try {
  TypeGqlResolver = require('type-graphql').Resolver;
  getMetadataStorage = require('type-graphql/dist/metadata/getMetadataStorage')
    .getMetadataStorage;
} catch (e) {}

export function Resolver();
export function Resolver(name: string);
export function Resolver(classType: Type<any>, options?: ResolverClassOptions);
export function Resolver(
  typeFunc: ClassTypeResolver,
  options?: ResolverClassOptions,
);
export function Resolver(
  nameOrType?: string | ClassTypeResolver | Type<any>,
  options?: ResolverClassOptions,
) {
  return (
    target: Object | Function,
    key?: string | symbol,
    descriptor?: any,
  ) => {
    let name = nameOrType && getClassName(nameOrType);

    // @ObjectType()
    if (getMetadataStorage && isFunction(nameOrType)) {
      const ctor = getClassOrUndefined(nameOrType as Function);
      const objectMetadata = getMetadataStorage().objectTypes.find(
        type => type.target === ctor,
      );
      objectMetadata && (name = objectMetadata.name);
    }
    addResolverMetadata(undefined, name, target, key, descriptor);
    if (!isString(nameOrType)) {
      TypeGqlResolver &&
        lazyMetadataStorage.store(() =>
          TypeGqlResolver(nameOrType, options)(target as Function),
        );
    }
  };
}
