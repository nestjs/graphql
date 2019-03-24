import { Type } from '@nestjs/common';
import { isString } from '@nestjs/common/utils/shared.utils';
import * as optional from 'optional';
import {
  ClassTypeResolver,
  ResolverClassOptions,
} from './../external/type-graphql.types';
import { addResolverMetadata, getClassName } from './resolvers.utils';

const { Resolver: TypeGqlResolver } = optional('type-graphql') || ({} as any);

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
    const name = nameOrType && getClassName(nameOrType);

    addResolverMetadata(undefined, name, target, key, descriptor);
    if (!isString(nameOrType)) {
      TypeGqlResolver &&
        TypeGqlResolver(nameOrType, options)(target as Function);
    }
  };
}
