import { NullableList } from '../../interfaces';

export class DefaultNullableConflictError extends Error {
  constructor(
    hostTypeName: string,
    defaultVal: any,
    isNullable: boolean | NullableList,
  ) {
    super(
      `Incorrect "nullable" option value set for ${hostTypeName}. Do not combine "defaultValue: ${defaultVal}" with "nullable: ${isNullable}".`,
    );
  }
}
