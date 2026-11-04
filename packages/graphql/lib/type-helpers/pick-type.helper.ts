import { Type } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils.js';
import {
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from '@nestjs/mapped-types';
import { Field } from '../decorators/index.js';
import { ClassDecoratorFactory } from '../interfaces/class-decorator-factory.interface.js';
import { MetadataLoader } from '../plugin/metadata-loader.js';
import { PropertyMetadata } from '../schema-builder/metadata/index.js';
import { getFieldsAndDecoratorForType } from '../schema-builder/utils/get-fields-and-decorator.util.js';
import { applyFieldDecorators } from './type-helpers.utils.js';

export function PickType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
  decorator?: ClassDecoratorFactory,
): Type<Pick<T, (typeof keys)[number]>> {
  const { fields, decoratorFactory } = getFieldsAndDecoratorForType(classRef, {
    decorator,
  });

  // Property keys are passed as strings, whereas "keyof T" is a number for a
  // numeric property (e.g. a numeric enum member)
  const pickedKeys = keys.map((key) =>
    typeof key === 'number' ? String(key) : key,
  );
  const isInheritedPredicate = (propertyKey: string) =>
    pickedKeys.includes(propertyKey);
  abstract class PickObjectType {
    constructor() {
      inheritPropertyInitializers(this, classRef, isInheritedPredicate);
    }
  }
  if (decorator && decorator !== decoratorFactory) {
    decoratorFactory({ isAbstract: true })(PickObjectType);
    decorator({ isAbstract: true })(PickObjectType);
  } else {
    decoratorFactory({ isAbstract: true })(PickObjectType);
  }

  inheritValidationMetadata(classRef, PickObjectType, isInheritedPredicate);
  inheritTransformationMetadata(classRef, PickObjectType, isInheritedPredicate);

  function applyFields(fields: PropertyMetadata[]) {
    fields
      .filter((item) => isInheritedPredicate(item.name))
      .forEach((item) => {
        if (isFunction(item.typeFn)) {
          // Execute type function eagerly to update the type options object (before "clone" operation)
          // when the passed function (e.g., @Field(() => Type)) lazily returns an array.
          item.typeFn();
        }

        Field(item.typeFn, { ...item.options })(
          PickObjectType.prototype,
          item.name,
        );
        applyFieldDecorators(PickObjectType, item, classRef);
      });
  }
  applyFields(fields);

  // Register a refresh hook to update the fields when the serialized metadata
  // is loaded from file.
  MetadataLoader.addRefreshHook(() => {
    const { fields } = getFieldsAndDecoratorForType(classRef, {
      overrideFields: true,
      decorator,
    });
    applyFields(fields);
  });

  return PickObjectType as Type<Pick<T, (typeof keys)[number]>>;
}
