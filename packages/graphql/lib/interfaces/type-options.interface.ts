import { BaseTypeOptions } from './base-type-options.interface.js';

export type TypeOptions<T = any> = BaseTypeOptions<T> & {
  isArray?: boolean;
  arrayDepth?: number;
};
