import { PipeTransform, Type } from '@nestjs/common';
import 'reflect-metadata';
import { BaseTypeOptions } from '../interfaces';
export interface ArgsOptions extends BaseTypeOptions {
  name?: string;
  description?: string;
  type?: () => any;
}
export declare function Args(): ParameterDecorator;
export declare function Args(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export declare function Args(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export declare function Args(
  options: ArgsOptions,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export declare function Args(
  property: string,
  options: ArgsOptions,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
