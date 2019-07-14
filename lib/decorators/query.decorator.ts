import { isString } from '@nestjs/common/utils/shared.utils';
import { Resolvers } from '../enums/resolvers.enum';
import { lazyMetadataStorage } from '../storages/lazy-metadata.storage';
import {
  AdvancedOptions,
  ReturnTypeFunc,
} from './../external/type-graphql.types';
import { addResolverMetadata } from './resolvers.utils';

let TypeGqlQuery: Function;
try {
  TypeGqlQuery = require('type-graphql').Query;
} catch (e) {}

export function Query(): MethodDecorator;
export function Query(name: string): MethodDecorator;
export function Query(
  typeFunc: ReturnTypeFunc,
  options?: AdvancedOptions,
): MethodDecorator;
export function Query(
  nameOrType?: string | ReturnTypeFunc,
  options?: AdvancedOptions,
): MethodDecorator {
  return (
    target: Object | Function,
    key?: string | symbol,
    descriptor?: any,
  ) => {
    const name = isString(nameOrType)
      ? nameOrType
      : (options && options.name) || undefined;

    addResolverMetadata(Resolvers.QUERY, name, target, key, descriptor);
    if (nameOrType && !isString(nameOrType)) {
      TypeGqlQuery &&
        lazyMetadataStorage.store(() =>
          TypeGqlQuery(nameOrType, options)(
            target as Function,
            key,
            descriptor,
          ),
        );
    }
  };
}
