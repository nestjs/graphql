import { ResolveTypeFn } from '../../interfaces';
import { ClassMetadata } from './class.metadata';

export interface InterfaceMetadata extends ClassMetadata {
  resolveType?: ResolveTypeFn;
}
