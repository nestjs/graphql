import { SetMetadata } from '@nestjs/common';
import { RESOLVER_PREFIX_METADATA, } from '../graphql.constants';

export function ResolverPrefix(name: string): ClassDecorator {
  return (target, key?, descriptor?) => {
    SetMetadata(RESOLVER_PREFIX_METADATA, name)(target, key, descriptor);
  };
}
