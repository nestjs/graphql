import { ResolveTypeFn } from '../../interfaces';
import type { Lazy, Many } from '../../utils/types';
import { ClassMetadata } from './class.metadata';

export interface InterfaceMetadata extends ClassMetadata {
  resolveType?: ResolveTypeFn;
  interfaces?: Lazy<Many<Function>>;
}
