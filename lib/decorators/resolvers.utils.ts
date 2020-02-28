import { SetMetadata, Type } from '@nestjs/common';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils';
import { Resolvers } from '../enums/resolvers.enum';
import {
  RESOLVER_NAME_METADATA,
  RESOLVER_TYPE_METADATA,
} from '../graphql.constants';

export function addResolverMetadata(
  resolver: Resolvers | string | undefined,
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
