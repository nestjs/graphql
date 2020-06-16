import { Type } from '@nestjs/common';
import { ClassDecoratorFactory } from '../interfaces/class-decorator-factory.interface';
export declare function OmitType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
  decorator?: ClassDecoratorFactory,
): Type<Omit<T, typeof keys[number]>>;
