import { Type } from '@nestjs/common';
import { ClassDecoratorFactory } from '../interfaces/class-decorator-factory.interface';
export declare function PartialType<T>(
  classRef: Type<T>,
  decorator?: ClassDecoratorFactory,
): Type<Partial<T>>;
