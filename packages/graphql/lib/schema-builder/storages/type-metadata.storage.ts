import { Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { addFieldMetadata } from '../../decorators';
import { METADATA_FACTORY_NAME } from '../../plugin/plugin-constants';
import { MetadataByTargetCollection } from '../collections/';
import { CannotDetermineHostTypeError } from '../errors/cannot-determine-host-type.error';
import { UndefinedTypeError } from '../errors/undefined-type.error';
import {
  BaseResolverMetadata,
  ClassDirectiveMetadata,
  ClassExtensionsMetadata,
  ClassMetadata,
  EnumMetadata,
  FieldResolverMetadata,
  MethodArgsMetadata,
  PropertyDirectiveMetadata,
  PropertyExtensionsMetadata,
  PropertyMetadata,
  ResolverClassMetadata,
  ResolverTypeMetadata,
  UnionMetadata,
} from '../metadata';
import { InterfaceMetadata } from '../metadata/interface.metadata';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata';
import { isThrowing } from '../utils/is-throwing.util';

export class TypeMetadataStorageHost {
  private queries = new Array<ResolverTypeMetadata>();
  private mutations = new Array<ResolverTypeMetadata>();
  private subscriptions = new Array<ResolverTypeMetadata>();
  private fieldResolvers = new Array<FieldResolverMetadata>();
  private readonly enums = new Array<EnumMetadata>();
  private readonly unions = new Array<UnionMetadata>();
  private readonly metadataByTargetCollection =
    new MetadataByTargetCollection();

  addMutationMetadata(metadata: ResolverTypeMetadata) {
    this.mutations.push(metadata);
  }

  getMutationsMetadata(): ResolverTypeMetadata[] {
    return this.mutations;
  }

  addQueryMetadata(metadata: ResolverTypeMetadata) {
    this.queries.push(metadata);
  }

  getQueriesMetadata(): ResolverTypeMetadata[] {
    return this.queries;
  }

  addSubscriptionMetadata(metadata: ResolverTypeMetadata) {
    this.subscriptions.push(metadata);
  }

  getSubscriptionsMetadata(): ResolverTypeMetadata[] {
    return this.subscriptions;
  }

  addResolverPropertyMetadata(metadata: FieldResolverMetadata) {
    this.fieldResolvers.push(metadata);
  }

  addArgsMetadata(metadata: ClassMetadata) {
    this.metadataByTargetCollection.get(metadata.target).argumentType =
      metadata;
  }

  getArgumentsMetadata(): ClassMetadata[] {
    return this.metadataByTargetCollection.all.argumentType;
  }

  getArgumentsMetadataByTarget(
    target: Type<unknown>,
  ): ClassMetadata | undefined {
    return this.metadataByTargetCollection.get(target).argumentType;
  }

  addInterfaceMetadata(metadata: InterfaceMetadata) {
    this.metadataByTargetCollection.get(metadata.target).interface = metadata;
  }

  getInterfacesMetadata(): InterfaceMetadata[] {
    return [...this.metadataByTargetCollection.all.interface.values()];
  }

  getInterfaceMetadataByTarget(
    target: Type<unknown>,
  ): InterfaceMetadata | undefined {
    return this.metadataByTargetCollection.get(target).interface;
  }

  addInputTypeMetadata(metadata: ClassMetadata) {
    this.metadataByTargetCollection.get(metadata.target).inputType = metadata;
  }

  getInputTypesMetadata(): ClassMetadata[] {
    return this.metadataByTargetCollection.all.inputType;
  }

  getInputTypeMetadataByTarget(
    target: Type<unknown>,
  ): ObjectTypeMetadata | undefined {
    return this.metadataByTargetCollection.get(target).inputType;
  }

  addObjectTypeMetadata(metadata: ObjectTypeMetadata) {
    this.metadataByTargetCollection.get(metadata.target).objectType = metadata;
  }

  getObjectTypesMetadata(): ObjectTypeMetadata[] {
    return this.metadataByTargetCollection.all.objectType;
  }

  getObjectTypeMetadataByTarget(
    target: Type<unknown>,
  ): ObjectTypeMetadata | undefined {
    return this.metadataByTargetCollection.get(target).objectType;
  }

  addEnumMetadata(metadata: EnumMetadata) {
    this.enums.push(metadata);
  }

  getEnumsMetadata(): EnumMetadata[] {
    return this.enums;
  }

  addUnionMetadata(metadata: UnionMetadata) {
    this.unions.push(metadata);
  }

  getUnionsMetadata(): UnionMetadata[] {
    return this.unions;
  }

  addDirectiveMetadata(metadata: ClassDirectiveMetadata) {
    const classMetadata = this.metadataByTargetCollection.get(metadata.target);
    if (!classMetadata.fieldDirectives.sdls.has(metadata.sdl)) {
      classMetadata.classDirectives.push(metadata);
    }
  }

  addDirectivePropertyMetadata(metadata: PropertyDirectiveMetadata) {
    this.metadataByTargetCollection
      .get(metadata.target)
      .fieldDirectives.add(metadata);
  }

  addExtensionsMetadata(metadata: ClassExtensionsMetadata) {
    this.metadataByTargetCollection
      .get(metadata.target)
      .classExtensions.push(metadata);
  }

  addExtensionsPropertyMetadata(metadata: PropertyExtensionsMetadata) {
    this.metadataByTargetCollection
      .get(metadata.target)
      .fieldExtensions.add(metadata, metadata.fieldName);
  }

  addResolverMetadata(metadata: ResolverClassMetadata) {
    this.metadataByTargetCollection.get(metadata.target).resolver = metadata;
  }

  addClassFieldMetadata(metadata: PropertyMetadata) {
    const existingMetadata = this.metadataByTargetCollection
      .get(metadata.target)
      .fields.getByName(metadata.name);

    if (existingMetadata) {
      const options = existingMetadata.options;
      // inherit nullable option
      if (isUndefined(options.nullable) && isUndefined(options.defaultValue)) {
        options.nullable = metadata.options.nullable;
      }
    } else {
      this.metadataByTargetCollection
        .get(metadata.target)
        .fields.add(metadata, metadata.name);
    }
  }

  addMethodParamMetadata(metadata: MethodArgsMetadata) {
    this.metadataByTargetCollection
      .get(metadata.target)
      .params.unshift(metadata, metadata.methodName);
  }

  compile(orphanedTypes: (Function | object)[] = []) {
    this.metadataByTargetCollection.compile();

    const classMetadata = [
      ...this.metadataByTargetCollection.all.objectType,
      ...this.metadataByTargetCollection.all.inputType,
      ...this.metadataByTargetCollection.all.argumentType,
      ...this.metadataByTargetCollection.all.interface.values(),
    ];
    this.loadClassPluginMetadata(classMetadata);
    this.compileClassMetadata(classMetadata);
    this.compileFieldResolverMetadata(this.fieldResolvers);

    const resolversMetadata = [
      ...this.queries,
      ...this.mutations,
      ...this.subscriptions,
    ];
    this.compileResolversMetadata(resolversMetadata);
    this.compileExtendedResolversMetadata();

    orphanedTypes.forEach(
      (type) => 'prototype' in type && this.applyPluginMetadata(type.prototype),
    );
  }

  loadClassPluginMetadata(metadata: ClassMetadata[]) {
    metadata
      .filter((item) => item?.target)
      .forEach((item) => this.applyPluginMetadata(item.target.prototype));
  }

  applyPluginMetadata(prototype: Function) {
    do {
      if (!prototype.constructor) {
        return;
      }
      if (!prototype.constructor[METADATA_FACTORY_NAME]) {
        continue;
      }
      const metadata = prototype.constructor[METADATA_FACTORY_NAME]();
      const properties = Object.keys(metadata);
      properties.forEach((key) => {
        if (metadata[key].type) {
          const { type, ...options } = metadata[key];
          addFieldMetadata(type, options, prototype, key, undefined, true);
        } else {
          addFieldMetadata(
            metadata[key],
            undefined,
            prototype,
            key,
            undefined,
            true,
          );
        }
      });
    } while (
      (prototype = Reflect.getPrototypeOf(prototype) as Type<any>) &&
      prototype !== Object.prototype &&
      prototype
    );
  }

  compileClassMetadata(metadata: ClassMetadata[]) {
    metadata.forEach((item) => {
      if (!item.properties) {
        item.properties = this.getClassFieldsByPredicate(item);
      }
      if (!item.directives) {
        item.directives = this.metadataByTargetCollection
          .get(item.target)
          .classDirectives.getAll();
      }
      if (!item.extensions) {
        item.extensions = this.metadataByTargetCollection
          .get(item.target)
          .classExtensions.reduce(
            (curr, acc) => ({ ...curr, ...acc.value }),
            {},
          );
      }
    });
  }

  clear() {
    Object.assign(this, new TypeMetadataStorageHost());
  }

  private getClassFieldsByPredicate(item: ClassMetadata) {
    const fields = this.metadataByTargetCollection
      .get(item.target)
      .fields.getAll();
    fields.forEach((field) => {
      field.methodArgs = this.metadataByTargetCollection
        .get(item.target)
        .params.getByName(field.name);
      field.directives = this.metadataByTargetCollection
        .get(item.target)
        .fieldDirectives.getByName(field.name);
      field.extensions = this.metadataByTargetCollection
        .get(item.target)
        .fieldExtensions.getByName(field.name)
        .reduce((curr, acc) => ({ ...curr, ...acc.value }), {});
    });
    return fields;
  }

  private compileResolversMetadata(metadata: BaseResolverMetadata[]) {
    metadata.forEach((item) => {
      item.classMetadata = this.metadataByTargetCollection.get(
        item.target,
      ).resolver;
      item.methodArgs = this.metadataByTargetCollection
        .get(item.target)
        .params.getByName(item.methodName);
      item.directives = this.metadataByTargetCollection
        .get(item.target)
        .fieldDirectives.getByName(item.methodName);
      item.extensions = this.metadataByTargetCollection
        .get(item.target)
        .fieldExtensions.getByName(item.methodName)
        .reduce((curr, acc) => ({ ...curr, ...acc.value }), {});
    });
  }

  private compileFieldResolverMetadata(metadata: FieldResolverMetadata[]) {
    this.compileResolversMetadata(metadata);

    metadata.forEach((item) => {
      item.directives = this.metadataByTargetCollection
        .get(item.target)
        .fieldDirectives.getByName(item.methodName);
      item.extensions = this.metadataByTargetCollection
        .get(item.target)
        .fieldExtensions.getByName(item.methodName)
        .reduce((curr, acc) => ({ ...curr, ...acc.value }), {});

      item.objectTypeFn =
        item.kind === 'external'
          ? this.metadataByTargetCollection.get(item.target).resolver.typeFn
          : () => item.target as Type<unknown>;

      if (item.kind === 'external') {
        this.compileExternalFieldResolverMetadata(item);
      }
    });
  }

  private compileExternalFieldResolverMetadata(item: FieldResolverMetadata) {
    const [target, objectOrInterfaceTypeMetadata, objectOrInterfaceTypeField] =
      this.findModelFieldMetadata(item);
    if (!objectOrInterfaceTypeField) {
      if (!item.typeFn || !item.typeOptions) {
        throw new UndefinedTypeError(item.target.name, item.methodName);
      }
      const fieldMetadata: PropertyMetadata = {
        name: item.methodName,
        schemaName: item.schemaName,
        deprecationReason: item.deprecationReason,
        description: item.description,
        typeFn: item.typeFn,
        target,
        options: item.typeOptions,
        methodArgs: item.methodArgs,
        directives: item.directives,
        extensions: item.extensions,
        complexity: item.complexity,
      };
      this.addClassFieldMetadata(fieldMetadata);

      objectOrInterfaceTypeMetadata.properties.push(fieldMetadata);
    } else {
      const isEmpty = (arr: unknown[]) => arr.length === 0;
      if (isEmpty(objectOrInterfaceTypeField.methodArgs)) {
        objectOrInterfaceTypeField.methodArgs = item.methodArgs;
      }
      if (isEmpty(objectOrInterfaceTypeField.directives)) {
        objectOrInterfaceTypeField.directives = item.directives;
      }
      if (!objectOrInterfaceTypeField.extensions) {
        objectOrInterfaceTypeField.extensions = item.extensions;
      }
      objectOrInterfaceTypeField.complexity =
        item.complexity === undefined
          ? objectOrInterfaceTypeField.complexity
          : item.complexity;
    }
  }

  private findModelFieldMetadata(
    item: FieldResolverMetadata,
  ): [Function, ClassMetadata, PropertyMetadata | undefined] {
    let objectTypeRef = this.metadataByTargetCollection
      .get(item.target)
      .resolver.typeFn();
    const getTypeMetadata = (target: any) => {
      const metadata = this.metadataByTargetCollection.get(target);
      return metadata.objectType || metadata.interface;
    };
    let objectOrInterfaceTypeMetadata = getTypeMetadata(objectTypeRef);
    if (!objectOrInterfaceTypeMetadata) {
      throw new CannotDetermineHostTypeError(
        item.schemaName,
        objectTypeRef?.name,
      );
    }
    let objectOrInterfaceTypeField =
      objectOrInterfaceTypeMetadata.properties.find(
        (fieldDef) => fieldDef.name === item.methodName,
      );
    for (
      let _objectTypeRef = objectTypeRef;
      !objectOrInterfaceTypeField && _objectTypeRef?.prototype;
      _objectTypeRef = Object.getPrototypeOf(_objectTypeRef)
    ) {
      const possibleTypeMetadata = getTypeMetadata(_objectTypeRef);
      objectOrInterfaceTypeField = possibleTypeMetadata?.properties.find(
        (fieldDef) => fieldDef.name === item.methodName,
      );
      if (objectOrInterfaceTypeField) {
        objectTypeRef = _objectTypeRef;
        objectOrInterfaceTypeMetadata = possibleTypeMetadata;
        break;
      }
    }
    return [
      objectTypeRef,
      objectOrInterfaceTypeMetadata,
      objectOrInterfaceTypeField,
    ];
  }

  private compileExtendedResolversMetadata() {
    this.metadataByTargetCollection.all.resolver.forEach((item) => {
      let parentClass = Object.getPrototypeOf(item.target);

      while (parentClass.prototype) {
        const parentMetadata = this.metadataByTargetCollection.get(
          item.target,
        ).resolver;

        if (parentMetadata) {
          this.queries = this.mergeParentResolverHandlers(
            this.queries,
            parentClass,
            item,
          );
          this.mutations = this.mergeParentResolverHandlers(
            this.mutations,
            parentClass,
            item,
          );
          this.subscriptions = this.mergeParentResolverHandlers(
            this.subscriptions,
            parentClass,
            item,
          );
          this.fieldResolvers = this.mergeParentFieldHandlers(
            this.fieldResolvers,
            parentClass,
            item,
          );
        }
        parentClass = Object.getPrototypeOf(parentClass);
      }
    });
  }

  private mergeParentResolverHandlers<
    T extends ResolverTypeMetadata | FieldResolverMetadata,
  >(
    metadata: T[],
    parentClass: Function,
    classMetadata: ResolverClassMetadata,
  ): T[] {
    return metadata.map((metadata) => {
      return metadata.target !== parentClass
        ? metadata
        : {
            ...metadata,
            target: classMetadata.target,
            classMetadata,
          };
    });
  }

  private mergeParentFieldHandlers(
    metadata: FieldResolverMetadata[],
    parentClass: Function,
    classMetadata: ResolverClassMetadata,
  ) {
    const parentMetadata = this.mergeParentResolverHandlers(
      metadata,
      parentClass,
      classMetadata,
    );
    return parentMetadata.map((metadata) => {
      return metadata.target === parentClass
        ? metadata
        : {
            ...metadata,
            objectTypeFn: isThrowing(metadata.objectTypeFn)
              ? classMetadata.typeFn
              : metadata.objectTypeFn,
          };
    });
  }
}

const globalRef = global as any;
export const TypeMetadataStorage: TypeMetadataStorageHost =
  globalRef.GqlTypeMetadataStorage ||
  (globalRef.GqlTypeMetadataStorage = new TypeMetadataStorageHost());
