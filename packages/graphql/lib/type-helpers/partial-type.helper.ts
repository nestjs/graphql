import { Type } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import {
  applyIsOptionalDecorator,
  applyValidateIfDefinedDecorator,
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from '@nestjs/mapped-types';
import { Field } from '../decorators';
import { ClassDecoratorFactory } from '../interfaces/class-decorator-factory.interface';
import { MetadataLoader } from '../plugin/metadata-loader';
import { METADATA_FACTORY_NAME } from '../plugin/plugin-constants';
import { PropertyMetadata } from '../schema-builder/metadata';
import { getFieldsAndDecoratorForType } from '../schema-builder/utils/get-fields-and-decorator.util';
import { applyFieldDecorators } from './type-helpers.utils';

interface PartialTypeOptions {
  decorator?: ClassDecoratorFactory;
  omitDefaultValues?: boolean;
  skipNullProperties?: boolean;
}

function isPartialTypeOptions(
  optionsOrDecorator: PartialTypeOptions | ClassDecoratorFactory,
): optionsOrDecorator is PartialTypeOptions {
  return (
    optionsOrDecorator &&
    ('decorator' in optionsOrDecorator ||
      'omitDefaultValues' in optionsOrDecorator ||
      'skipNullProperties' in optionsOrDecorator)
  );
}

export function PartialType<T>(
  classRef: Type<T>,
  optionsOrDecorator?: ClassDecoratorFactory | PartialTypeOptions,
): Type<Partial<T>> {
  const { fields, decoratorFactory } = getFieldsAndDecoratorForType(classRef);
  abstract class PartialObjectType {
    constructor() {
      inheritPropertyInitializers(this, classRef);
    }
  }

  let decorator: ClassDecoratorFactory | undefined;
  let omitDefaultValues = false;
  let skipNullProperties = true;
  if (isPartialTypeOptions(optionsOrDecorator)) {
    decorator = optionsOrDecorator.decorator;
    omitDefaultValues = optionsOrDecorator.omitDefaultValues;
    skipNullProperties = optionsOrDecorator.skipNullProperties ?? true;
  } else {
    decorator = optionsOrDecorator;
  }

  const applyPartialDecoratorFn =
    skipNullProperties === false
      ? applyValidateIfDefinedDecorator
      : applyIsOptionalDecorator;

  if (decorator) {
    decorator({ isAbstract: true })(PartialObjectType);
  } else {
    decoratorFactory({ isAbstract: true })(PartialObjectType);
  }

  inheritValidationMetadata(classRef, PartialObjectType);
  inheritTransformationMetadata(classRef, PartialObjectType);

  function applyFields(fields: PropertyMetadata[]) {
    fields.forEach((item) => {
      if (isFunction(item.typeFn)) {
        // Execute type function eagerly to update the type options object (before "clone" operation)
        // when the passed function (e.g., @Field(() => Type)) lazily returns an array.
        item.typeFn();
      }
      Field(item.typeFn, {
        ...item.options,
        nullable: true,
        defaultValue: omitDefaultValues ? undefined : item.options.defaultValue,
      })(PartialObjectType.prototype, item.name);
      applyPartialDecoratorFn(PartialObjectType, item.name);
      applyFieldDecorators(PartialObjectType, item);
    });
  }
  applyFields(fields);

  // Register a refresh hook to update the fields when the serialized metadata
  // is loaded from file.
  MetadataLoader.addRefreshHook(() => {
    const { fields } = getFieldsAndDecoratorForType(classRef, {
      overrideFields: true,
    });
    applyFields(fields);
  });

  if (PartialObjectType[METADATA_FACTORY_NAME]) {
    const pluginFields = Object.keys(
      PartialObjectType[METADATA_FACTORY_NAME](),
    );
    pluginFields.forEach((key) =>
      applyPartialDecoratorFn(PartialObjectType, key),
    );
  }

  Object.defineProperty(PartialObjectType, 'name', {
    value: `Partial${classRef.name}`,
  });
  return PartialObjectType as Type<Partial<T>>;
}
