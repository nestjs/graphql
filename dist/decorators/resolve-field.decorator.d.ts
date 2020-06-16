import { Complexity } from '../interfaces';
import { BaseTypeOptions } from '../interfaces/base-type-options.interface';
import { ReturnTypeFunc } from '../interfaces/return-type-func.interface';
export interface ResolveFieldOptions extends BaseTypeOptions {
  name?: string;
  description?: string;
  deprecationReason?: string;
  complexity?: Complexity;
}
export declare function ResolveField(
  typeFunc?: ReturnTypeFunc,
  options?: ResolveFieldOptions,
): MethodDecorator;
export declare function ResolveField(
  propertyName?: string,
  typeFunc?: ReturnTypeFunc,
  options?: ResolveFieldOptions,
): MethodDecorator;
