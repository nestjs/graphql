import 'reflect-metadata';
import {
  RESOLVER_NAME_METADATA,
  RESOLVER_PROPERTY_METADATA,
  RESOLVER_REFERENCE_KEY,
  RESOLVER_REFERENCE_METADATA,
  RESOLVER_TYPE_METADATA,
} from '../graphql.constants.js';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface.js';

/**
 * Set by `@Resolver()` next to the resolver type: `true` when the type was
 * given as a class (`@Resolver(() => Type)`), i.e., when it names a code first
 * object or interface type and never a root operation type, whatever its name.
 */
export const RESOLVER_TYPE_REFERENCE_METADATA =
  'graphql:resolver_type_reference';

/**
 * `ResolverMetadata` along with how the handler was declared.
 */
export interface ExtractedResolverMetadata extends ResolverMetadata {
  /** The method is decorated with `@ResolveField()`. */
  isPropertyResolver: boolean;
  /** The method is decorated with `@ResolveReference()`. */
  isReferenceResolver: boolean;
  /** See `RESOLVER_TYPE_REFERENCE_METADATA`. */
  isTypeReference: boolean;
  /** The class of the instance the handler was found on. */
  target: Function;
  /** The class whose prototype declares the handler method. */
  declaredOn: Function;
}

export function extractMetadata(
  instance: Record<string, any>,
  prototype: any,
  methodName: string,
  filterPredicate: (
    resolverType: string,
    isReferenceResolver?: boolean,
    isPropertyResolver?: boolean,
    isTypeReference?: boolean,
  ) => boolean,
): ExtractedResolverMetadata {
  const callback = prototype[methodName];
  const methodResolverType = Reflect.getMetadata(
    RESOLVER_TYPE_METADATA,
    callback,
  );
  const resolverType =
    methodResolverType ||
    Reflect.getMetadata(RESOLVER_TYPE_METADATA, instance.constructor);
  // Read from where the type was read from
  const isTypeReference = !!Reflect.getMetadata(
    RESOLVER_TYPE_REFERENCE_METADATA,
    methodResolverType ? callback : instance.constructor,
  );

  const isPropertyResolver = !!Reflect.getMetadata(
    RESOLVER_PROPERTY_METADATA,
    callback,
  );

  const resolverName = Reflect.getMetadata(RESOLVER_NAME_METADATA, callback);
  const isReferenceResolver = !!Reflect.getMetadata(
    RESOLVER_REFERENCE_METADATA,
    callback,
  );

  if (
    filterPredicate(
      resolverType,
      isReferenceResolver,
      isPropertyResolver,
      isTypeReference,
    )
  ) {
    return null;
  }

  const name = isReferenceResolver
    ? RESOLVER_REFERENCE_KEY
    : resolverName || methodName;
  return {
    type: resolverType,
    methodName,
    name,
    isPropertyResolver,
    isReferenceResolver,
    isTypeReference,
    target: instance.constructor,
    declaredOn: getDeclaringClass(prototype, methodName),
  };
}

function getDeclaringClass(prototype: any, methodName: string): Function {
  let current = prototype;
  while (
    current &&
    !Object.prototype.hasOwnProperty.call(current, methodName)
  ) {
    current = Object.getPrototypeOf(current);
  }
  return current?.constructor;
}
