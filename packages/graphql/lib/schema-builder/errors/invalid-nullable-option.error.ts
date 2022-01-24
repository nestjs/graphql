import { NullableList } from '../../interfaces';

export class InvalidNullableOptionError extends Error {
  constructor(name: string, nullable?: boolean | NullableList) {
    super(
      `Incorrect nullable option set for ${name}. Do not combine non-list type with nullable "${nullable}".`,
    );
  }
}
