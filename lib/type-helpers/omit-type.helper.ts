import { Type } from '@nestjs/common';
import { Field } from '../decorators';
import { getFieldsAndDecoratorForType } from '../schema-builder/utils/get-fields-and-decorator.util';

export function OmitType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: K[],
): Type<Omit<T, typeof keys[number]>> {
  const { fields, decoratorFactory } = getFieldsAndDecoratorForType(classRef);

  abstract class OmitObjectType {}
  decoratorFactory({ isAbstract: true })(OmitObjectType);

  fields
    .filter((item) => !keys.includes(item.schemaName as K))
    .forEach((item) =>
      Field(item.typeFn, { ...item.options })(
        OmitObjectType.prototype,
        item.name,
      ),
    );
  return OmitObjectType as Type<Omit<T, typeof keys[number]>>;
}
