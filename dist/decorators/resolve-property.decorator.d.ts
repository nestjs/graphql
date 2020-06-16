import { ReturnTypeFunc } from '../interfaces/return-type-func.interface';
import { ResolveFieldOptions } from './resolve-field.decorator';
export declare function ResolveProperty(
  typeFunc?: ReturnTypeFunc,
  options?: ResolveFieldOptions,
): MethodDecorator;
export declare function ResolveProperty(
  propertyName?: string,
  typeFunc?: ReturnTypeFunc,
  options?: ResolveFieldOptions,
): MethodDecorator;
