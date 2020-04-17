import { Type } from '@nestjs/common';
import { Field } from '../decorators';
import { getFieldsAndDecoratorForType } from '../schema-builder/utils/get-fields-and-decorator.util';
import {
  ClassDecoratorFactory,
  inheritValidationMetadata,
  inheritTransformationMetadata,
} from './type-helpers.utils';

export function IntersectionType<A, B>(
  classARef: Type<A>,
  classBRef: Type<B>,
  decorator?: ClassDecoratorFactory,
): Type<A & B> {
  const forA = getFieldsAndDecoratorForType(classARef);
  const forB = getFieldsAndDecoratorForType(classBRef);
  const decoratorFactory = forA.decoratorFactory;
  const fields = [...forA.fields, ...forB.fields];

  abstract class IntersectionObjectType {}
  decoratorFactory({ isAbstract: true })(IntersectionObjectType);
  if (decorator) {
    decorator({ isAbstract: true })(IntersectionObjectType);
  } else {
    decoratorFactory({ isAbstract: true })(IntersectionObjectType);
  }

  inheritValidationMetadata(classARef, IntersectionObjectType);
  inheritTransformationMetadata(classARef, IntersectionObjectType);
  inheritValidationMetadata(classBRef, IntersectionObjectType);
  inheritTransformationMetadata(classBRef, IntersectionObjectType);

  fields.forEach((item) => {
    Field(item.typeFn, { ...item.options })(
      IntersectionObjectType.prototype,
      item.name,
    );
  });

  Object.defineProperty(IntersectionObjectType, 'name', {
    value: `Intersection${classARef.name}${classBRef.name}`,
  });
  return IntersectionObjectType as Type<A & B>;
}
