import { PipeTransform, Type } from '@nestjs/common';
export declare function isPipe(
  value: unknown,
): value is PipeTransform | Type<PipeTransform>;
