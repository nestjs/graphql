import { PipeTransform, Type } from '@nestjs/common';
import 'reflect-metadata';
export declare function Context(): ParameterDecorator;
export declare function Context(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export declare function Context(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
