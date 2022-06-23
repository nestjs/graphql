import { isString, isObject } from '@nestjs/common/utils/shared.utils';
import { AutoSchemaFileValue, UseFed2Value } from '../interfaces';

export function getPathForAutoSchemaFile(
  autoSchemaFile: AutoSchemaFileValue,
): string | null {
  if (isString(autoSchemaFile)) {
    return autoSchemaFile;
  }
  if (isObject(autoSchemaFile) && autoSchemaFile.path) {
    return autoSchemaFile.path;
  }
  return null;
}

export function getFederation2Info(
  autoSchemaFile: AutoSchemaFileValue,
): UseFed2Value {
  if (isObject(autoSchemaFile)) {
    return autoSchemaFile.useFed2;
  }
  return false;
}
