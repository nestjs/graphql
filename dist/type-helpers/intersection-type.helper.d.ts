import { Type } from '@nestjs/common';
import { ClassDecoratorFactory } from '../interfaces/class-decorator-factory.interface';
export declare function IntersectionType<A, B>(
  classARef: Type<A>,
  classBRef: Type<B>,
  decorator?: ClassDecoratorFactory,
): Type<A & B>;
