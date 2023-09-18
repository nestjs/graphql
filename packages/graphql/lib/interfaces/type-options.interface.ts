import { BaseTypeOptions } from './base-type-options.interface';

export type TypeOptions<T = any> = BaseTypeOptions<T> & {
  isArray?: boolean;
  arrayDepth?: number;
};
