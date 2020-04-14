import { Type } from '@nestjs/common';
import { Field } from '../decorators';
import { getFieldsAndDecoratorForType } from '../schema-builder/utils/get-fields-and-decorator.util';
import {
  ClassDecoratorFactory,
  inheritValidationMetadata,
  inheritTransformationMetadata,
} from './type-helpers.utils';

export function MixinType<A, B>(
  classARef: Type<A>,
  classBRef: Type<B>,
  decorator?: ClassDecoratorFactory,
): Type<A> & Type<B> {
  const forA = getFieldsAndDecoratorForType(classARef);
  const forB = getFieldsAndDecoratorForType(classBRef);
  const decoratorFactory = forA.decoratorFactory;
  const fields = [...forA.fields, ...forB.fields];

  abstract class MixinObjectType {}
  decoratorFactory({ isAbstract: true })(MixinObjectType);
  if (decorator) {
    decorator({ isAbstract: true })(MixinObjectType);
  } else {
    decoratorFactory({ isAbstract: true })(MixinObjectType);
  }

  inheritValidationMetadata(classARef, MixinObjectType);
  inheritTransformationMetadata(classARef, MixinObjectType);
  inheritValidationMetadata(classBRef, MixinObjectType);
  inheritTransformationMetadata(classBRef, MixinObjectType);

  fields.forEach((item) => {
    Field(item.typeFn, { ...item.options })(
      MixinObjectType.prototype,
      item.name,
    );
  });

  Object.defineProperty(MixinObjectType, 'name', {
    value: `Mixin${classARef.name}${classBRef.name}`,
  });
  return MixinObjectType as Type<A> & Type<B>;
}
