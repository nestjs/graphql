import { Type } from '@nestjs/common';
import { ClassDecoratorFactory } from '../interfaces/class-decorator-factory.interface';
export declare function PickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
  decorator?: ClassDecoratorFactory,
): Type<Pick<T, typeof keys[number]>>;
