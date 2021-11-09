import { SetMetadata } from '@nestjs/common';
import { RESOLVER_REFERENCE_METADATA } from '../graphql.constants';

/**
 * Property reference resolver (method) Decorator.
 */
export function ResolveReference(): MethodDecorator {
  return (
    target: Function | Object,
    key?: string | symbol,
    descriptor?: any,
  ) => {
    SetMetadata(RESOLVER_REFERENCE_METADATA, true)(target, key, descriptor);
  };
}
