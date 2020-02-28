import { isUndefined } from '@nestjs/common/utils/shared.utils';

export class UndefinedTypeError extends Error {
  constructor(name: string, key: string, index?: number) {
    super(
      `Undefined type error. Make sure you are providing an explicit type for the "${key}" ${
        isUndefined(index) ? '' : `(parameter at index [${index}]) `
      }of the "${name}" class.`,
    );
  }
}
