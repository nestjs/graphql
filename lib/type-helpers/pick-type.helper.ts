import { Type } from '@nestjs/common';
import { Field } from '../decorators';
import { getFieldsAndDecoratorForType } from '../schema-builder/utils/get-fields-and-decorator.util';
import {
  ClassDecoratorFactory,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';

export function PickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: K[],
  decorator?: ClassDecoratorFactory,
): Type<Pick<T, typeof keys[number]>> {
  const { fields, decoratorFactory } = getFieldsAndDecoratorForType(classRef);

  abstract class PickObjectType {}
  decoratorFactory({ isAbstract: true })(PickObjectType);
  if (decorator) {
    decorator({ isAbstract: true })(PickObjectType);
  } else {
    decoratorFactory({ isAbstract: true })(PickObjectType);
  }

  const isInheritedPredicate = (propertyKey: string) =>
    keys.includes(propertyKey as K);
  inheritValidationMetadata(classRef, PickObjectType, isInheritedPredicate);
  inheritTransformationMetadata(classRef, PickObjectType, isInheritedPredicate);

  fields
    .filter((item) => keys.includes(item.schemaName as K))
    .forEach((item) =>
      Field(item.typeFn, { ...item.options })(
        PickObjectType.prototype,
        item.name,
      ),
    );
  return PickObjectType as Type<Pick<T, typeof keys[number]>>;
}
