import { isString } from '@nestjs/common/utils/shared.utils';
import { Resolvers } from '../enums/resolvers.enum';
import { lazyMetadataStorage } from '../storages/lazy-metadata.storage';
import {
  AdvancedOptions,
  ReturnTypeFunc,
} from './../external/type-graphql.types';
import { addResolverMetadata } from './resolvers.utils';

let TypeGqlMutation: Function;
try {
  TypeGqlMutation = require('type-graphql').Mutation;
} catch (e) {}

export function Mutation(): MethodDecorator;
export function Mutation(name: string): MethodDecorator;
export function Mutation(
  typeFunc: ReturnTypeFunc,
  options?: AdvancedOptions,
): MethodDecorator;
export function Mutation(
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

    addResolverMetadata(Resolvers.MUTATION, name, target, key, descriptor);
    if (nameOrType && !isString(nameOrType)) {
      TypeGqlMutation &&
        lazyMetadataStorage.store(() =>
          TypeGqlMutation(nameOrType, options)(
            target as Function,
            key,
            descriptor,
          ),
        );
    }
  };
}
