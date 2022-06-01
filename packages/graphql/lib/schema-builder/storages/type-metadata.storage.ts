import { Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { addFieldMetadata } from '../../decorators';
import { METADATA_FACTORY_NAME } from '../../plugin/plugin-constants';
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
import { MetadataStorageCollectionList } from '../collections/';

export class TypeMetadataStorageHost {
  /**
   * The implementation of this class has been heavily inspired by the following code:
   * @ref https://github.com/MichalLytek/type-graphql/blob/master/src/metadata/metadata-storage.ts
   * -
   * 1.6.22 Implementation was modified to use Maps instead of Arrays for better performance
   */
  private queries = new Array<ResolverTypeMetadata>();
  private mutations = new Array<ResolverTypeMetadata>();
  private subscriptions = new Array<ResolverTypeMetadata>();
  private fieldResolvers = new Array<FieldResolverMetadata>();
  private readonly enums = new Array<EnumMetadata>();
  private readonly unions = new Array<UnionMetadata>();

  targets = new MetadataStorageCollectionList();

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
    this.targets.get(metadata.target).argumentType = metadata;
  }

  getArgumentsMetadata(): ClassMetadata[] {
    return this.targets.all.argumentType;
  }

  getArgumentsMetadataByTarget(
    target: Type<unknown>,
  ): ClassMetadata | undefined {
    return this.targets.get(target).argumentType;
  }

  addInterfaceMetadata(metadata: InterfaceMetadata) {
    this.targets.get(metadata.target).interface = metadata;
  }

  getInterfacesMetadata(): InterfaceMetadata[] {
    return this.targets.all.interface;
  }

  getInterfaceMetadataByTarget(
    target: Type<unknown>,
  ): InterfaceMetadata | undefined {
    return this.targets.get(target).interface;
  }

  addInputTypeMetadata(metadata: ClassMetadata) {
    this.targets.get(metadata.target).inputType = metadata;
  }

  getInputTypesMetadata(): ClassMetadata[] {
    return this.targets.all.inputType;
  }

  getInputTypeMetadataByTarget(
    target: Type<unknown>,
  ): ObjectTypeMetadata | undefined {
    return this.targets.get(target).inputType;
  }

  addObjectTypeMetadata(metadata: ObjectTypeMetadata) {
    this.targets.get(metadata.target).objectType = metadata;
  }

  getObjectTypesMetadata(): ObjectTypeMetadata[] {
    return this.targets.all.objectType;
  }

  getObjectTypeMetadataByTarget(
    target: Type<unknown>,
  ): ObjectTypeMetadata | undefined {
    return this.targets.get(target).objectType;
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
    const classMetadata = this.targets.get(metadata.target);
    if (!classMetadata.fieldDirectives.sdls.has(metadata.sdl)) {
      classMetadata.classDirectives.push(metadata);
    }
  }

  addDirectivePropertyMetadata(metadata: PropertyDirectiveMetadata) {
    this.targets.get(metadata.target).fieldDirectives.add(metadata);
  }

  addExtensionsMetadata(metadata: ClassExtensionsMetadata) {
    this.targets.get(metadata.target).classExtensions.push(metadata);
  }

  addExtensionsPropertyMetadata(metadata: PropertyExtensionsMetadata) {
    this.targets
      .get(metadata.target)
      .fieldExtensions.add(metadata, metadata.fieldName);
  }

  addResolverMetadata(metadata: ResolverClassMetadata) {
    this.targets.get(metadata.target).resolver = metadata;
  }

  addClassFieldMetadata(metadata: PropertyMetadata) {
    const existingMetadata = this.targets
      .get(metadata.target)
      .fields.getByName(metadata.name);

    if (existingMetadata) {
      const options = existingMetadata.options;
      // inherit nullable option
      if (isUndefined(options.nullable) && isUndefined(options.defaultValue)) {
        options.nullable = metadata.options.nullable;
      }
    } else {
      this.targets.get(metadata.target).fields.add(metadata, metadata.name);
    }
  }

  addMethodParamMetadata(metadata: MethodArgsMetadata) {
    this.targets
      .get(metadata.target)
      .params.unshift(metadata, metadata.methodName);
  }

  compile(orphanedTypes: (Function | object)[] = []) {
    this.targets.compile();

    const classMetadata = [
      ...this.targets.all.objectType,
      ...this.targets.all.inputType,
      ...this.targets.all.argumentType,
      ...this.targets.all.interface,
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
        item.directives = this.targets.get(item.target).classDirectives;
      }
      if (!item.extensions) {
        item.extensions = this.targets
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
    const fields = this.targets.get(item.target).fields.getAll();
    fields.forEach((field) => {
      field.methodArgs = this.targets
        .get(item.target)
        .params.getByName(field.name);
      field.directives = this.targets
        .get(item.target)
        .fieldDirectives.getByName(field.name);
      field.extensions = this.targets
        .get(item.target)
        .fieldExtensions.getByName(field.name)
        .reduce((curr, acc) => ({ ...curr, ...acc.value }), {});
    });
    return fields;
  }

  private compileResolversMetadata(metadata: BaseResolverMetadata[]) {
    metadata.forEach((item) => {
      item.classMetadata = this.targets.get(item.target).resolver;
      item.methodArgs = this.targets
        .get(item.target)
        .params.getByName(item.methodName);
      item.directives = this.targets
        .get(item.target)
        .fieldDirectives.getByName(item.methodName);
      item.extensions = this.targets
        .get(item.target)
        .fieldExtensions.getByName(item.methodName)
        .reduce((curr, acc) => ({ ...curr, ...acc.value }), {});
    });
  }

  private compileFieldResolverMetadata(metadata: FieldResolverMetadata[]) {
    this.compileResolversMetadata(metadata);

    metadata.forEach((item) => {
      item.directives = this.targets
        .get(item.target)
        .fieldDirectives.getByName(item.methodName);
      item.extensions = this.targets
        .get(item.target)
        .fieldExtensions.getByName(item.methodName)
        .reduce((curr, acc) => ({ ...curr, ...acc.value }), {});

      item.objectTypeFn =
        item.kind === 'external'
          ? this.targets.get(item.target).resolver.typeFn
          : () => item.target as Type<unknown>;

      if (item.kind === 'external') {
        this.compileExternalFieldResolverMetadata(item);
      }
    });
  }

  private compileExternalFieldResolverMetadata(item: FieldResolverMetadata) {
    const objectTypeRef = this.targets.get(item.target).resolver.typeFn();

    const objectOrInterfaceTypeMetadata =
      this.targets.get(objectTypeRef).objectType ||
      this.targets.get(objectTypeRef).interface;

    if (!objectOrInterfaceTypeMetadata) {
      throw new CannotDetermineHostTypeError(
        item.schemaName,
        objectTypeRef?.name,
      );
    }
    const objectOrInterfaceTypeField =
      objectOrInterfaceTypeMetadata.properties.find(
        (fieldDef) => fieldDef.name === item.methodName,
      );
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
        target: objectTypeRef,
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

  private compileExtendedResolversMetadata() {
    this.targets.all.resolver.forEach((item) => {
      let parentClass = Object.getPrototypeOf(item.target);

      while (parentClass.prototype) {
        const parentMetadata = this.targets.get(item.target).resolver;

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
