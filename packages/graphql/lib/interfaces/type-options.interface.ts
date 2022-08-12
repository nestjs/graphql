import { BaseTypeOptions } from './base-type-options.interface';

export interface TypeOptions<T = any> extends BaseTypeOptions<T> {
  isArray?: boolean;
  arrayDepth?: number;
}
