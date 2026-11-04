import { SetMetadata, Type } from '@nestjs/common';
import { ENTRY_PROVIDER_WATERMARK } from '@nestjs/common/constants.js';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils.js';
import { Resolver } from '../enums/resolver.enum.js';
import {
  RESOLVER_NAME_METADATA,
  RESOLVER_TYPE_METADATA,
} from '../graphql.constants.js';
import { UndefinedResolverTypeError } from '../schema-builder/errors/undefined-resolver-type.error.js';
import { ResolverTypeFn } from './resolver.decorator.js';

export function addResolverMetadata(
  resolver: Resolver | string | undefined,
  name: string | undefined,
  target?: Record<string, any> | Function,
  key?: string | symbol,
  descriptor?: any,
) {
  SetMetadata(RESOLVER_TYPE_METADATA, resolver || name)(
    target,
    key,
    descriptor,
  );
  SetMetadata(RESOLVER_NAME_METADATA, name)(target, key, descriptor);
  if (key && typeof target === 'object') {
    // A class that declares handlers (e.g., "@Injectable()" with "@Query()"
    // methods, without "@Resolver()") is an entry provider too: Nest binds
    // request or transient-scoped global enhancers to entry providers only
    SetMetadata(ENTRY_PROVIDER_WATERMARK, true)(target.constructor);
  }
}

export function getClassName(nameOrType: string | Function | Type<any>) {
  if (isString(nameOrType)) {
    return nameOrType;
  }
  const classOrUndefined = getClassOrUndefined(nameOrType);
  return classOrUndefined && classOrUndefined.name;
}

export function getResolverTypeFn(nameOrType: Function, target: Function) {
  return nameOrType
    ? nameOrType.prototype
      ? () => nameOrType as Type<unknown>
      : (nameOrType as ResolverTypeFn)
    : () => {
        throw new UndefinedResolverTypeError(target.name);
      };
}

export function getClassOrUndefined(typeOrFunc: Function | Type<any>) {
  return isConstructor(typeOrFunc)
    ? typeOrFunc
    : isFunction(typeOrFunc)
    ? (typeOrFunc as Function)()
    : undefined;
}

function isConstructor(obj: any) {
  return (
    !!obj.prototype &&
    !!obj.prototype.constructor &&
    !!obj.prototype.constructor.name
  );
}
