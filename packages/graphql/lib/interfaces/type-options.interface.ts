import { BaseTypeOptions } from './base-type-options.interface';

export interface TypeOptions extends BaseTypeOptions {
  isArray?: boolean;
  arrayDepth?: number;
}
