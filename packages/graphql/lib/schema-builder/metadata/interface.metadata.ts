import { ResolveTypeFn } from '../../interfaces/index.js';
import { ClassMetadata } from './class.metadata.js';

export interface InterfaceMetadata extends ClassMetadata {
  resolveType?: ResolveTypeFn;
  interfaces?: Function | Function[] | (() => Function | Function[]);
}
