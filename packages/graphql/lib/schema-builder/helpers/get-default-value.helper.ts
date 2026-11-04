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
  // Ignore members inherited from "Object.prototype" (e.g., "toString",
  // "constructor") so they are not mistaken for field initializers.
  const initializerValue =
    Object.prototype.hasOwnProperty.call(instance, key) ||
    !(key in Object.prototype)
      ? instance[key]
      : undefined;
  if (isUndefined(options.defaultValue)) {
    // A "null" initializer (e.g., inherited from a base class in which the
    // field is nullable) is not a default of a non-nullable field: graphql-js
    // would no longer require the value and pass "null" to the resolver.
    return initializerValue === null && !options.nullable
      ? undefined
      : initializerValue;
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
