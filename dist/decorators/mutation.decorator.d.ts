import 'reflect-metadata';
import { BaseTypeOptions } from '../interfaces/base-type-options.interface';
import { ReturnTypeFunc } from '../interfaces/return-type-func.interface';
export interface MutationOptions extends BaseTypeOptions {
  name?: string;
  description?: string;
  deprecationReason?: string;
}
export declare function Mutation(): MethodDecorator;
export declare function Mutation(name: string): MethodDecorator;
export declare function Mutation(
  typeFunc: ReturnTypeFunc,
  options?: MutationOptions,
): MethodDecorator;
