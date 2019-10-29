import 'reflect-metadata';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';
import {
  RESOLVER_DELEGATE_METADATA,
  RESOLVER_NAME_METADATA,
  RESOLVER_PROPERTY_METADATA,
  RESOLVER_REFERENCE_KEY,
  RESOLVER_REFERENCE_METADATA,
  RESOLVER_TYPE_METADATA,
} from '../graphql.constants';

export function extractMetadata(
  instance: Object,
  prototype: any,
  methodName: string,
  filterPredicate: (
    resolverType: string,
    isDelegated: boolean,
    isReferenceResolver?: boolean,
    isPropertyResolver?: boolean,
  ) => boolean,
): ResolverMetadata {
  const callback = prototype[methodName];
  const resolverType =
    Reflect.getMetadata(RESOLVER_TYPE_METADATA, callback) ||
    Reflect.getMetadata(RESOLVER_TYPE_METADATA, instance.constructor);

  const isPropertyResolver = !!Reflect.getMetadata(RESOLVER_PROPERTY_METADATA, callback);

  const resolverName = Reflect.getMetadata(RESOLVER_NAME_METADATA, callback);
  const isDelegated = !!Reflect.getMetadata(RESOLVER_DELEGATE_METADATA, callback);

  const isReferenceResolver = !!Reflect.getMetadata(RESOLVER_REFERENCE_METADATA, callback);

  if (filterPredicate(resolverType, isDelegated, isReferenceResolver, isPropertyResolver)) {
    return null;
  }

  const name = isReferenceResolver ? RESOLVER_REFERENCE_KEY : resolverName || methodName;

  return {
    type: resolverType,
    methodName,
    name,
  };
}
