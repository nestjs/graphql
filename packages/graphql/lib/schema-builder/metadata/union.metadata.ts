import { Type } from '@nestjs/common';
import { ResolveTypeFn } from '../../interfaces';

export interface UnionMetadata<T extends Type<unknown>[] = Type<unknown>[]> {
  name: string;
  typesFn: () => T;
  id?: symbol;
  description?: string;
  resolveType?: ResolveTypeFn;
}
