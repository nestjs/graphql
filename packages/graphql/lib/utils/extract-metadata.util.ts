import 'reflect-metadata';
import {
  RESOLVER_NAME_METADATA,
  RESOLVER_PROPERTY_METADATA,
  RESOLVER_REFERENCE_KEY,
  RESOLVER_REFERENCE_METADATA,
  RESOLVER_TYPE_METADATA,
} from '../graphql.constants';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';

export function extractMetadata(
  instance: Record<string, any>,
  prototype: any,
  methodName: string,
  filterPredicate: (
    resolverType: string,
    isReferenceResolver?: boolean,
    isPropertyResolver?: boolean,
  ) => boolean,
): ResolverMetadata {
  const callback = prototype[methodName];
  const resolverType =
    Reflect.getMetadata(RESOLVER_TYPE_METADATA, callback) ||
    Reflect.getMetadata(RESOLVER_TYPE_METADATA, instance.constructor);

  const isPropertyResolver = !!Reflect.getMetadata(
    RESOLVER_PROPERTY_METADATA,
    callback,
  );

  const resolverName = Reflect.getMetadata(RESOLVER_NAME_METADATA, callback);
  const isReferenceResolver = !!Reflect.getMetadata(
    RESOLVER_REFERENCE_METADATA,
    callback,
  );

  if (filterPredicate(resolverType, isReferenceResolver, isPropertyResolver)) {
    return null;
  }

  const name = isReferenceResolver
    ? RESOLVER_REFERENCE_KEY
    : resolverName || methodName;
  return {
    type: resolverType,
    methodName,
    name,
  };
}
