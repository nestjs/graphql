import { Complexity } from '../interfaces';
import { BaseTypeOptions } from '../interfaces/base-type-options.interface';
import { ReturnTypeFunc } from '../interfaces/return-type-func.interface';
export interface FieldOptions extends BaseTypeOptions {
  name?: string;
  description?: string;
  deprecationReason?: string;
  complexity?: Complexity;
}
export declare function Field(): PropertyDecorator & MethodDecorator;
export declare function Field(
  options: FieldOptions,
): PropertyDecorator & MethodDecorator;
export declare function Field(
  returnTypeFunction?: ReturnTypeFunc,
  options?: FieldOptions,
): PropertyDecorator & MethodDecorator;
export declare function addFieldMetadata(
  typeOrOptions: ReturnTypeFunc | FieldOptions,
  fieldOptions: FieldOptions,
  prototype: Object,
  propertyKey?: string,
  descriptor?: TypedPropertyDescriptor<any>,
  loadEagerly?: boolean,
): void;
