import { isString } from '@nestjs/common/utils/shared.utils';
import * as optional from 'optional';
import { Resolvers } from '../enums/resolvers.enum';
import {
  AdvancedOptions,
  ReturnTypeFunc,
} from './../external/type-graphql.types';
import { addResolverMetadata } from './resolvers.utils';

const { Query: TypeGqlQuery } = optional('type-graphql') || ({} as any);

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
        TypeGqlQuery(nameOrType, options)(target as Function, key, descriptor);
    }
  };
}
