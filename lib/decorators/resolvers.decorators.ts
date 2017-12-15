import { ReflectMetadata } from '@nestjs/common';
import {
  RESOLVER_TYPE_METADATA,
  RESOLVER_NAME_METADATA,
  RESOLVER_PROPERTY_METADATA,
  RESOLVER_DELEGATE_METADATA,
} from '../graphql.constants';
import { Resolvers } from '../enums/resolvers.enum';

export function createResolverDecorator(
  resolver?: Resolvers | string,
): (name?: string) => any {
  return (name?: string) => (target, key?, descriptor?) => {
    ReflectMetadata(RESOLVER_TYPE_METADATA, resolver || name)(
      target,
      key,
      descriptor,
    );
    ReflectMetadata(RESOLVER_NAME_METADATA, name)(target, key, descriptor);
  };
}

export function createPropertyDecorator(propertyName?: string): MethodDecorator {
  return (target, key?, descriptor?) => {
    ReflectMetadata(RESOLVER_NAME_METADATA, propertyName)(
      target,
      key,
      descriptor,
    );
    ReflectMetadata(RESOLVER_PROPERTY_METADATA, propertyName)(
      target,
      key,
      descriptor,
    );
  };
}

export function createDelegateDecorator(propertyName?: string): MethodDecorator {
  return (target, key?, descriptor?) => {
    ReflectMetadata(RESOLVER_NAME_METADATA, propertyName)(
      target,
      key,
      descriptor,
    );
    ReflectMetadata(RESOLVER_DELEGATE_METADATA, propertyName)(
      target,
      key,
      descriptor,
    );
  };
}

export const Query = createResolverDecorator(Resolvers.QUERY);
export const Mutation = createResolverDecorator(Resolvers.MUTATION);
export const Subscription = createResolverDecorator(Resolvers.SUBSCRIPTION);
export const Resolver = createResolverDecorator();

export const ResolveProperty = createPropertyDecorator;
export const DelegateProperty = createDelegateDecorator;
