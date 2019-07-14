import { SetMetadata, Type } from '@nestjs/common';
import {
  isFunction,
  isObject,
  isString,
} from '@nestjs/common/utils/shared.utils';
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
import { lazyMetadataStorage } from '../storages/lazy-metadata.storage';

let FieldResolver: Function;
try {
  FieldResolver = require('type-graphql').FieldResolver;
} catch (e) {}

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
  typeFunc?: ReturnTypeFunc,
  options?: AdvancedOptions,
): MethodDecorator;
export function createPropertyDecorator(
  propertyName?: string,
  typeFunc?: ReturnTypeFunc,
  options?: AdvancedOptions,
);
export function createPropertyDecorator(
  propertyNameOrFunc?: string | ReturnTypeFunc,
  typeFuncOrOptions?: ReturnTypeFunc | AdvancedOptions,
  advancedOptions?: AdvancedOptions,
): MethodDecorator {
  return (
    target: Function | Object,
    key?: string | symbol,
    descriptor?: any,
  ) => {
    let [propertyName, typeFunc, options] = isFunction(propertyNameOrFunc)
      ? [undefined, propertyNameOrFunc, typeFuncOrOptions]
      : [propertyNameOrFunc, typeFuncOrOptions, advancedOptions];

    SetMetadata(RESOLVER_NAME_METADATA, propertyName)(target, key, descriptor);
    SetMetadata(RESOLVER_PROPERTY_METADATA, true)(target, key, descriptor);

    const isField = true;
    if (FieldResolver && isField) {
      options = isObject(options)
        ? {
            name: propertyName as string,
            ...options,
          }
        : propertyName
        ? { name: propertyName as string }
        : undefined;

      lazyMetadataStorage.store(() =>
        FieldResolver(typeFunc, options)(target, key, descriptor),
      );
    }
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
  const classOrUndefined = getClassOrUndefined(nameOrType);
  return classOrUndefined && classOrUndefined.name;
};

export const getClassOrUndefined = (typeOrFunc: Function | Type<any>) => {
  return isConstructor(typeOrFunc)
    ? typeOrFunc
    : isFunction(typeOrFunc)
    ? (typeOrFunc as Function)()
    : undefined;
};

function isConstructor(obj: any) {
  return (
    !!obj.prototype &&
    !!obj.prototype.constructor &&
    !!obj.prototype.constructor.name
  );
}
