import { PipeTransform, Type } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';

export function isPipe(
  value: unknown,
): value is PipeTransform | Type<PipeTransform> {
  if (!value) {
    return false;
  }
  if (isFunction(value)) {
    return true;
  }
  return isFunction((value as PipeTransform).transform);
}
