import { isUndefined } from '@nestjs/common/utils/shared.utils.js';
import { isEqual } from 'es-toolkit';
import { TypeOptions } from '../../interfaces/type-options.interface.js';
import { DefaultValuesConflictError } from '../errors/default-values-conflict.error.js';

export function getDefaultValue<T = any>(
  instance: object,
  options: TypeOptions,
  key: string,
  typeName: string,
): T | undefined {
  const initializerValue = instance[key];
  if (isUndefined(options.defaultValue)) {
    return initializerValue;
  }
  if (
    !isEqual(options.defaultValue, initializerValue) &&
    !isUndefined(initializerValue)
  ) {
    throw new DefaultValuesConflictError(
      typeName,
      key,
      options.defaultValue,
      initializerValue,
    );
  }
  return options.defaultValue;
}
