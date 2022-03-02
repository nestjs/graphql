import { Type } from '@nestjs/common';
import { ResolveTypeFn } from '../../interfaces';

export interface UnionMetadata<T extends readonly Type<unknown>[] = readonly Type<unknown>[]> {
  name: string;
  typesFn: () => T;
  id?: symbol;
  description?: string;
  resolveType?: ResolveTypeFn;
}
