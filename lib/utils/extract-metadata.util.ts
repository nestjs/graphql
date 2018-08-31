import 'reflect-metadata';
import {
  RESOLVER_DELEGATE_METADATA,
  RESOLVER_NAME_METADATA,
  RESOLVER_TYPE_METADATA,
} from '../graphql.constants';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';

export function extractMetadata(
  instance,
  prototype,
  methodName: string,
  filterPredicate: (resolverType: string, isDelegated: boolean) => boolean,
): ResolverMetadata {
  const callback = prototype[methodName];
  const resolverType =
    Reflect.getMetadata(RESOLVER_TYPE_METADATA, callback) ||
    Reflect.getMetadata(RESOLVER_TYPE_METADATA, instance.constructor);

  const resolverName = Reflect.getMetadata(RESOLVER_NAME_METADATA, callback);
  const isDelegated = !!Reflect.getMetadata(
    RESOLVER_DELEGATE_METADATA,
    callback,
  );
  if (filterPredicate(resolverType, isDelegated)) {
    return null;
  }
  return {
    name: resolverName || methodName,
    type: resolverType,
    methodName,
  };
}
