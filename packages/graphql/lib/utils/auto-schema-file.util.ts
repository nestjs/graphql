import { isObject, isString } from '@nestjs/common/utils/shared.utils';
import { AutoSchemaFileValue } from '../interfaces';

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
