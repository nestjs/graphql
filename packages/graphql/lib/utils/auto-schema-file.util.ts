import { isObject, isString } from '@nestjs/common/utils/shared.utils.js';
import { AutoSchemaFileValue } from '../interfaces/index.js';

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
