import { ReturnTypeFunc } from '../interfaces/return-type-func.interface';
export declare function Scalar(name: string): ClassDecorator;
export declare function Scalar(
  name: string,
  typeFunc: ReturnTypeFunc,
): ClassDecorator;
