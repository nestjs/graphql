import { Type } from '@nestjs/common';
import { Field } from '../decorators';
import { getFieldsAndDecoratorForType } from '../schema-builder/utils/get-fields-and-decorator.util';
import {
  applyIsOptionalDecorator,
  ClassDecoratorFactory,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';

export function PartialType<T>(
  classRef: Type<T>,
  decorator?: ClassDecoratorFactory,
): Type<Partial<T>> {
  const { fields, decoratorFactory } = getFieldsAndDecoratorForType(classRef);

  abstract class PartialObjectType {}
  if (decorator) {
    decorator({ isAbstract: true })(PartialObjectType);
  } else {
    decoratorFactory({ isAbstract: true })(PartialObjectType);
  }

  inheritValidationMetadata(classRef, PartialObjectType);
  inheritTransformationMetadata(classRef, PartialObjectType);

  fields.forEach((item) => {
    Field(item.typeFn, { ...item.options, nullable: true })(
      PartialObjectType.prototype,
      item.name,
    );
    applyIsOptionalDecorator(PartialObjectType, item.name);
  });

  Object.defineProperty(PartialObjectType, 'name', {
    value: `Partial${classRef.name}`,
  });
  return PartialObjectType as Type<Partial<T>>;
}
