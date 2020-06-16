import {
  GqlTypeReference,
  ReturnTypeFunc,
} from '../interfaces/return-type-func.interface';
import { TypeOptions } from '../interfaces/type-options.interface';
export interface ReflectTypeOptions {
  metadataKey: 'design:type' | 'design:returntype' | 'design:paramtypes';
  prototype: Object;
  propertyKey: string;
  explicitTypeFn?: ReturnTypeFunc;
  typeOptions?: TypeOptions;
  index?: number;
}
export interface TypeMetadata {
  typeFn: (type?: any) => GqlTypeReference;
  options: TypeOptions;
}
export declare function reflectTypeFromMetadata(
  reflectOptions: ReflectTypeOptions,
): TypeMetadata;
