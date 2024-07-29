import type { Lazy, Many } from '../../utils/types';
import { ClassMetadata } from './class.metadata';

export interface ObjectTypeMetadata extends ClassMetadata {
  interfaces?: Lazy<Many<Function>>;
}
