import 'reflect-metadata';
import { BaseTypeOptions } from '../interfaces/base-type-options.interface';
import { ReturnTypeFunc } from '../interfaces/return-type-func.interface';
export interface QueryOptions extends BaseTypeOptions {
  name?: string;
  description?: string;
  deprecationReason?: string;
}
export declare function Query(): MethodDecorator;
export declare function Query(name: string): MethodDecorator;
export declare function Query(
  typeFunc: ReturnTypeFunc,
  options?: QueryOptions,
): MethodDecorator;
