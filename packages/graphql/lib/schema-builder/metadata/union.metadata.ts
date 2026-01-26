import { Type } from '@nestjs/common';
import { ResolveTypeFn } from '../../interfaces';
import { RegisterInOption } from './class.metadata';

export interface UnionMetadata<
  T extends readonly Type<unknown>[] = readonly Type<unknown>[],
> {
  name: string;
  typesFn: () => T;
  id?: symbol;
  description?: string;
  resolveType?: ResolveTypeFn;
  /**
   * NestJS module that this union belongs to.
   * @see RegisterInOption for details
   */
  registerIn?: RegisterInOption;
}
