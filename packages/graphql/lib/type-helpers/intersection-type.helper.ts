import { Type } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils.js';
import {
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata,
} from '@nestjs/mapped-types';
import { Field, FieldOptions } from '../decorators/index.js';
import { FIELD_MIDDLEWARE_METADATA } from '../graphql.constants.js';
import { ClassDecoratorFactory } from '../interfaces/class-decorator-factory.interface.js';
import { MetadataLoader } from '../plugin/metadata-loader.js';
import { PropertyMetadata } from '../schema-builder/metadata/index.js';
import { getFieldsAndDecoratorForType } from '../schema-builder/utils/get-fields-and-decorator.util.js';
import {
  applyFieldDecorators,
  getSourceFieldMiddleware,
} from './type-helpers.utils.js';

/**
 * Options of a property declared by both classes. The result is typed
 * "A & B", so the property must satisfy both declarations: it (or its list
 * items) is nullable only if both declare it so, and the middleware of both
 * runs. Its type and other options are those of the first class.
 */
function intersectFieldOptions(
  optionsA: FieldOptions,
  optionsB: FieldOptions,
): FieldOptions {
  const isListNullable = [optionsA.nullable, optionsB.nullable].every(
    (nullable) => nullable === true || nullable === 'itemsAndList',
  );
  const areItemsNullable = [optionsA.nullable, optionsB.nullable].every(
    (nullable) => nullable === 'items' || nullable === 'itemsAndList',
  );
  let nullable: FieldOptions['nullable'];
  if (areItemsNullable) {
    nullable = isListNullable ? 'itemsAndList' : 'items';
  } else if (isListNullable) {
    nullable = true;
  } else if (optionsA.nullable === false || optionsB.nullable === false) {
    nullable = false;
  }
  // Drop a default value the stricter field cannot have (any default with
  // "items", "null" for a non-nullable field), as the first class allowed it
  const isNotNullable = !nullable || nullable === 'items';
  const defaultValue =
    nullable === 'items' || (isNotNullable && optionsA.defaultValue === null)
      ? undefined
      : optionsA.defaultValue;

  const middleware = [
    ...new Set([
      ...(optionsA.middleware ?? []),
      ...(optionsB.middleware ?? []),
    ]),
  ];
  return {
    ...optionsA,
    description: optionsA.description ?? optionsB.description,
    deprecationReason: optionsA.deprecationReason ?? optionsB.deprecationReason,
    nullable,
    defaultValue,
    ...(middleware.length > 0 && { middleware }),
  };
}

function intersectFieldMiddleware(
  targetClass: Function,
  itemA: PropertyMetadata,
  itemB: PropertyMetadata,
  classARef: Function,
  classBRef: Function,
) {
  const middleware = new Set([
    ...getSourceFieldMiddleware(itemA, classARef),
    ...getSourceFieldMiddleware(itemB, classBRef),
  ]);
  if (middleware.size > 0) {
    Reflect.defineMetadata(
      FIELD_MIDDLEWARE_METADATA,
      [...middleware],
      targetClass.prototype,
      itemA.name,
    );
  }
}

export function IntersectionType<A, B>(
  classARef: Type<A>,
  classBRef: Type<B>,
  decorator?: ClassDecoratorFactory,
): Type<A & B> {
  const { decoratorFactory, fields: fieldsA } = getFieldsAndDecoratorForType(
    classARef,
    { decorator },
  );
  // Class B is read as the kind of type the intersection is built as.
  const decoratorB = decorator ?? decoratorFactory;
  const { fields: fieldsB } = getFieldsAndDecoratorForType(classBRef, {
    decorator: decoratorB,
  });

  abstract class IntersectionObjectType {
    constructor() {
      inheritPropertyInitializers(this, classARef);
      inheritPropertyInitializers(this, classBRef);
    }
  }
  if (decorator) {
    decorator({ isAbstract: true })(IntersectionObjectType);
  } else {
    decoratorFactory({ isAbstract: true })(IntersectionObjectType);
  }

  inheritValidationMetadata(classARef, IntersectionObjectType);
  inheritTransformationMetadata(classARef, IntersectionObjectType);
  inheritValidationMetadata(classBRef, IntersectionObjectType);
  inheritTransformationMetadata(classBRef, IntersectionObjectType);

  function applyFields(
    fieldsA: PropertyMetadata[],
    fieldsB: PropertyMetadata[],
  ) {
    [...fieldsA, ...fieldsB].forEach((item) => {
      if (isFunction(item.typeFn)) {
        // Execute type function eagerly to update the type options object (before "clone" operation)
        // when the passed function (e.g., @Field(() => Type)) lazily returns an array.
        item.typeFn();
      }
    });
    const fieldsBByName = new Map(fieldsB.map((item) => [item.name, item]));
    const fieldsAByName = new Map(fieldsA.map((item) => [item.name, item]));

    fieldsA.forEach((item) => {
      const sharedItem = fieldsBByName.get(item.name);
      Field(
        item.typeFn,
        sharedItem
          ? intersectFieldOptions(item.options, sharedItem.options)
          : { ...item.options },
      )(IntersectionObjectType.prototype, item.name);
      applyFieldDecorators(IntersectionObjectType, item, classARef);

      if (sharedItem) {
        applyFieldDecorators(IntersectionObjectType, sharedItem, classBRef);
        intersectFieldMiddleware(
          IntersectionObjectType,
          item,
          sharedItem,
          classARef,
          classBRef,
        );
      }
    });
    fieldsB
      .filter((item) => !fieldsAByName.has(item.name))
      .forEach((item) => {
        Field(item.typeFn, { ...item.options })(
          IntersectionObjectType.prototype,
          item.name,
        );
        applyFieldDecorators(IntersectionObjectType, item, classBRef);
      });
  }
  applyFields(fieldsA, fieldsB);

  // Register a refresh hook to update the fields when the serialized metadata
  // is loaded from file.
  MetadataLoader.addRefreshHook(() => {
    const { fields: fieldsA } = getFieldsAndDecoratorForType(classARef, {
      overrideFields: true,
      decorator,
    });
    const { fields: fieldsB } = getFieldsAndDecoratorForType(classBRef, {
      overrideFields: true,
      decorator: decoratorB,
    });

    applyFields(fieldsA, fieldsB);
  });

  Object.defineProperty(IntersectionObjectType, 'name', {
    value: `Intersection${classARef.name}${classBRef.name}`,
  });
  return IntersectionObjectType as Type<A & B>;
}
