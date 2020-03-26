import { Type } from '@nestjs/common';
import { Field } from '../decorators';
import { getFieldsAndDecoratorForType } from '../schema-builder/utils/get-fields-and-decorator.util';
import {
  applyIsOptionalDecorator,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from './type-helpers.utils';

export function PartialType<T>(classRef: Type<T>): Type<Partial<T>> {
  const { fields, decoratorFactory } = getFieldsAndDecoratorForType(classRef);

  abstract class PartialObjectType {}
  decoratorFactory({ isAbstract: true })(PartialObjectType);

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
