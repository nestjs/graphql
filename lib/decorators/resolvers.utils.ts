import { SetMetadata, Type } from '@nestjs/common';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils';
import * as optional from 'optional';
import { Resolvers } from '../enums/resolvers.enum';
import {
  AdvancedOptions,
  ReturnTypeFunc,
} from '../external/type-graphql.types';
import {
  RESOLVER_DELEGATE_METADATA,
  RESOLVER_NAME_METADATA,
  RESOLVER_PROPERTY_METADATA,
  RESOLVER_TYPE_METADATA,
} from '../graphql.constants';

const { FieldResolver } = optional('type-graphql') || ({} as any);

export function addResolverMetadata(
  resolver: Resolvers | string | undefined,
  name: string | undefined,
  target?: Object | Function,
  key?: string | symbol,
  descriptor?: string,
) {
  SetMetadata(RESOLVER_TYPE_METADATA, resolver || name)(
    target,
    key,
    descriptor,
  );
  SetMetadata(RESOLVER_NAME_METADATA, name)(target, key, descriptor);
}

export function createPropertyDecorator(
  propertyName?: string,
  typeFunc?: ReturnTypeFunc,
  options?: AdvancedOptions,
): MethodDecorator {
  return (
    target: Function | Object,
    key?: string | symbol,
    descriptor?: any,
  ) => {
    SetMetadata(RESOLVER_NAME_METADATA, propertyName)(target, key, descriptor);
    SetMetadata(RESOLVER_PROPERTY_METADATA, true)(target, key, descriptor);
    FieldResolver && FieldResolver(typeFunc, options)(target, key, descriptor);
  };
}

export function createDelegateDecorator(
  propertyName?: string,
  typeFunc?: ReturnTypeFunc,
  options?: AdvancedOptions,
): MethodDecorator {
  return (
    target: Function | Object,
    key?: string | symbol,
    descriptor?: any,
  ) => {
    SetMetadata(RESOLVER_NAME_METADATA, propertyName)(target, key, descriptor);
    SetMetadata(RESOLVER_DELEGATE_METADATA, propertyName)(
      target,
      key,
      descriptor,
    );
    FieldResolver && FieldResolver(typeFunc, options)(target, key, descriptor);
  };
}

export const getClassName = (nameOrType: string | Function | Type<any>) => {
  if (isString(nameOrType)) {
    return nameOrType;
  }
  return isConstructor(nameOrType)
    ? nameOrType.name
    : isFunction(nameOrType)
    ? (nameOrType as Function)().name
    : undefined;
};

function isConstructor(obj: any) {
  return (
    !!obj.prototype &&
    !!obj.prototype.constructor &&
    !!obj.prototype.constructor.name
  );
}
