import { RESOLVER_REFERENCE_KEY, RESOLVER_NAME_METADATA, RESOLVER_REFERENCE_METADATA } from '../graphql.constants';
import { SetMetadata } from '@nestjs/common';

export function ResolveReference(): MethodDecorator {
  return (target: Function | Object, key?: string | symbol, descriptor?: any) => {
    SetMetadata(RESOLVER_REFERENCE_METADATA, true)(target, key, descriptor);
    SetMetadata(RESOLVER_NAME_METADATA, RESOLVER_REFERENCE_KEY)(target, key, descriptor);
  };
}
