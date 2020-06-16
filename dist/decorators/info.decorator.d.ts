import { PipeTransform, Type } from '@nestjs/common';
import 'reflect-metadata';
export declare function Info(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
