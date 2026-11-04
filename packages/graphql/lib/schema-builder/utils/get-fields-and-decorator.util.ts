import { Type } from '@nestjs/common';
import 'reflect-metadata';
import {
  ArgsType,
  InputType,
  InterfaceType,
  ObjectType,
} from '../../decorators/index.js';
import { ClassType } from '../../enums/class-type.enum.js';
import { CLASS_TYPE_METADATA } from '../../graphql.constants.js';
import { ClassDecoratorFactory } from '../../interfaces/class-decorator-factory.interface.js';
import { UnableToFindFieldsError } from '../errors/unable-to-find-fields.error.js';
import { mergeInheritedFields } from '../helpers/merge-inherited-fields.helper.js';
import { ClassMetadata } from '../metadata/index.js';
import { LazyMetadataStorage } from '../storages/lazy-metadata.storage.js';
import { TypeMetadataStorage } from '../storages/type-metadata.storage.js';

/**
 * Returns the compiled field metadata of a class decorated with `@ObjectType()`,
 * `@InputType()`, `@InterfaceType()` or `@ArgsType()` (inherited fields
 * included), together with the class decorator that matches its kind.
 *
 * This is the building block of the mapped type helpers (`PartialType()`,
 * `PickType()`, etc.) and can be used to write custom ones. The returned
 * metadata objects are shared with the schema builder, so treat them as
 * read-only.
 *
 * @param objType the GraphQL type class
 * @param options.overrideFields recompile the field metadata of the class
 * instead of reusing the cached list (the built-in helpers pass it when the
 * plugin metadata is refreshed). Usually omitted.
 * @param options.decorator the class decorator of the type the fields are
 * collected for. A class registered as that kind of type too (e.g., decorated
 * with both `@ObjectType()` and `@InputType()`) is read as that kind.
 *
 * @throws {UnableToFindFieldsError} if the class is not a GraphQL type.
 *
 * @publicApi
 */
export function getFieldsAndDecoratorForType<T>(
  objType: Type<T>,
  options?: { overrideFields?: boolean; decorator?: ClassDecoratorFactory },
) {
  const classType = Reflect.getMetadata(CLASS_TYPE_METADATA, objType);
  if (!classType) {
    throw new UnableToFindFieldsError(objType.name);
  }

  LazyMetadataStorage.load([objType], {
    skipFieldLazyMetadata: true,
  });

  const [, decoratorFactory] = getClassMetadataAndFactoryByTargetAndType(
    classType,
    objType,
  );
  // "CLASS_TYPE_METADATA" only holds the kind of the class decorator applied
  // last, while a class registered as several kinds of type inherits from
  // different parent classes as each of them.
  const requestedClassType = getClassTypeByDecorator(options?.decorator);
  const fieldsClassType =
    requestedClassType &&
    getClassMetadataAndFactoryByTargetAndType(requestedClassType, objType)[0]
      ? requestedClassType
      : classType;

  const [classMetadata] = getClassMetadataAndFactoryByTargetAndType(
    fieldsClassType,
    objType,
  );
  if (!classMetadata) {
    throw new UnableToFindFieldsError(objType.name);
  }
  const inheritanceChain = [
    ...getParentClassesMetadata(objType, fieldsClassType),
    classMetadata,
  ];
  TypeMetadataStorage.loadClassPluginMetadata(inheritanceChain);
  TypeMetadataStorage.compileClassMetadata(inheritanceChain, options);

  if (!classMetadata.properties) {
    throw new UnableToFindFieldsError(objType.name);
  }
  // The nearest declaration of a field wins (the mapped type helpers register
  // every entry as a "@Field()" of the generated class, and the storage keeps
  // the first registration of a name), as it does in the schema factories.
  const fields = mergeInheritedFields(
    inheritanceChain.map((item) => item.properties),
  );

  return {
    fields,
    decoratorFactory,
  };
}

type ClassDecorator =
  | typeof ArgsType
  | typeof InterfaceType
  | typeof ObjectType
  | typeof InputType;
type MetadataAndFactoryTuple = [ClassMetadata | undefined, ClassDecorator];

function getClassMetadataAndFactoryByTargetAndType(
  classType: ClassType,
  objType: Type<unknown>,
): MetadataAndFactoryTuple {
  switch (classType) {
    case ClassType.ARGS:
      return [
        TypeMetadataStorage.getArgumentsMetadataByTarget(objType),
        ArgsType,
      ];
    case ClassType.OBJECT:
      return [
        TypeMetadataStorage.getObjectTypeMetadataByTarget(objType),
        ObjectType,
      ];
    case ClassType.INPUT:
      return [
        TypeMetadataStorage.getInputTypeMetadataByTarget(objType),
        InputType,
      ];
    case ClassType.INTERFACE:
      return [
        TypeMetadataStorage.getInterfaceMetadataByTarget(objType),
        InterfaceType,
      ];
  }
}

/**
 * The kinds of parent class each kind of type inherits the fields of in the
 * type definition factories (e.g., an input type only inherits the fields of
 * a parent class that is registered as an input type).
 */
const INHERITABLE_CLASS_TYPES: Record<ClassType, ClassType[]> = {
  [ClassType.ARGS]: [ClassType.ARGS],
  [ClassType.OBJECT]: [ClassType.OBJECT, ClassType.INTERFACE],
  [ClassType.INPUT]: [ClassType.INPUT],
  [ClassType.INTERFACE]: [ClassType.INTERFACE],
};

function getClassTypeByDecorator(
  decorator: ClassDecoratorFactory | undefined,
): ClassType | undefined {
  switch (decorator) {
    case ArgsType:
      return ClassType.ARGS;
    case ObjectType:
      return ClassType.OBJECT;
    case InputType:
      return ClassType.INPUT;
    case InterfaceType:
      return ClassType.INTERFACE;
  }
}

/**
 * Returns the metadata of the ancestors a class inherits the fields of as the
 * given kind of type, farthest first. As in the schema factories, an
 * `@ArgsType()` class skips the ancestors that are not arguments types, while
 * the other kinds stop at the first ancestor of an unrelated kind.
 */
function getParentClassesMetadata(
  objType: Type<unknown>,
  classType: ClassType,
): ClassMetadata[] {
  const parents: ClassMetadata[] = [];

  let parentClass = Object.getPrototypeOf(objType);
  while (parentClass && parentClass !== Function.prototype) {
    const parentMetadata = INHERITABLE_CLASS_TYPES[classType]
      .map((type) => ({
        type,
        metadata: getClassMetadataAndFactoryByTargetAndType(
          type,
          parentClass,
        )[0],
      }))
      .find(({ metadata }) => metadata);

    if (parentMetadata) {
      parents.unshift(parentMetadata.metadata);
      classType = parentMetadata.type;
    } else if (classType !== ClassType.ARGS) {
      break;
    }
    parentClass = Object.getPrototypeOf(parentClass);
  }
  return parents;
}
