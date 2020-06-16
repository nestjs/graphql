import { Type } from '@nestjs/common';
import { ResolveTypeFn } from '../interfaces/resolve-type-fn.interface';
export interface UnionOptions<T extends Type<unknown>[] = any[]> {
  name: string;
  description?: string;
  resolveType?: ResolveTypeFn<any, any>;
  types: () => T;
}
export declare type ArrayElement<
  ArrayType extends readonly unknown[]
> = ArrayType[number];
export declare type Union<T extends any[]> = InstanceType<ArrayElement<T>>;
export declare function createUnionType<T extends Type<unknown>[] = any[]>(
  options: UnionOptions<T>,
): Union<T>;
