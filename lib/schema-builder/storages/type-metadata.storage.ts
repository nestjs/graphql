/**
 * The API surface of this module has been heavily inspired by the "type-graphql" library (https://github.com/MichalLytek/type-graphql), originally designed & released by Michal Lytek.
 * In the v6 major release of NestJS, we introduced the code-first approach as a compatibility layer between this package and the `@nestjs/graphql` module.
 * Eventually, our team decided to reimplement all the features from scratch due to a lack of flexibility.
 * To avoid numerous breaking changes, the public API is backward-compatible and may resemble "type-graphql".
 */

import { Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { addFieldMetadata } from '../../decorators/field.decorator';
import { METADATA_FACTORY_NAME } from '../../plugin/plugin-constants';
import { CannotDetermineHostTypeError } from '../errors/cannot-determine-host-type.error';
import { UndefinedTypeError } from '../errors/undefined-type.error';
import {
  BaseResolverMetadata,
  ClassExtensionsMetadata,
  ClassMetadata,
  EnumMetadata,
  FieldResolverMetadata,
  MethodArgsMetadata,
  PropertyExtensionsMetadata,
  PropertyMetadata,
  ResolverClassMetadata,
  ResolverTypeMetadata,
  UnionMetadata,
} from '../metadata';
import {
  ClassDirectiveMetadata,
  PropertyDirectiveMetadata,
} from '../metadata/directive.metadata';
import { InterfaceMetadata } from '../metadata/interface.metadata';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata';
import { isTargetEqual } from '../utils/is-target-equal-util';
import { isThrowing } from '../utils/is-throwing.util';

export class TypeMetadataStorageHost {
  /**
   * The implementation of this class has been heavily inspired by the following code:
   * @ref https://github.com/MichalLytek/type-graphql/blob/master/src/metadata/metadata-storage.ts
   */
  private queries = new Array<ResolverTypeMetadata>();
  private mutations = new Array<ResolverTypeMetadata>();
  private subscriptions = new Array<ResolverTypeMetadata>();
  private fieldResolvers = new Array<FieldResolverMetadata>();
  private readonly resolvers = new Array<ResolverClassMetadata>();
  private readonly fields = new Array<PropertyMetadata>();
  private readonly params = new Array<MethodArgsMetadata>();
  private readonly interfaces = new Array<InterfaceMetadata>();
  private readonly enums = new Array<EnumMetadata>();
  private readonly unions = new Array<UnionMetadata>();
  private readonly classDirectives = new Array<ClassDirectiveMetadata>();
  private readonly fieldDirectives = new Array<PropertyDirectiveMetadata>();
  private readonly classExtensions = new Array<ClassExtensionsMetadata>();
  private readonly fieldExtensions = new Array<PropertyExtensionsMetadata>();
  private readonly objectTypes = new Array<ObjectTypeMetadata>();
  private readonly inputTypes = new Array<ClassMetadata>();
  private readonly argumentTypes = new Array<ClassMetadata>();

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
    this.argumentTypes.push(metadata);
  }

  getArgumentsMetadata(): ClassMetadata[] {
    return this.argumentTypes;
  }

  getArgumentsMetadataByTarget(
    target: Type<unknown>,
  ): ClassMetadata | undefined {
    return this.argumentTypes.find((item) => item.target === target);
  }

  addInterfaceMetadata(metadata: InterfaceMetadata) {
    this.interfaces.push(metadata);
  }

  getInterfacesMetadata(): InterfaceMetadata[] {
    return this.interfaces;
  }

  getInterfaceMetadataByTarget(
    target: Type<unknown>,
  ): InterfaceMetadata | undefined {
    return this.interfaces.find((item) => item.target === target);
  }

  addInputTypeMetadata(metadata: ClassMetadata) {
    this.inputTypes.push(metadata);
  }

  getInputTypesMetadata(): ClassMetadata[] {
    return this.inputTypes;
  }

  getInputTypeMetadataByTarget(
    target: Type<unknown>,
  ): ObjectTypeMetadata | undefined {
    return this.inputTypes.find((item) => item.target === target);
  }

  addObjectTypeMetadata(metadata: ObjectTypeMetadata) {
    this.objectTypes.push(metadata);
  }

  getObjectTypesMetadata(): ObjectTypeMetadata[] {
    return this.objectTypes;
  }

  getObjectTypeMetadataByTarget(
    target: Type<unknown>,
  ): ObjectTypeMetadata | undefined {
    return this.objectTypes.find((item) => item.target === target);
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
    const exist = this.fieldDirectives.some((directiveMetadata) => {
      return (
        directiveMetadata.sdl === metadata.sdl &&
        directiveMetadata.target === metadata.target
      );
    });
    if (!exist) {
      this.classDirectives.push(metadata);
    }
  }

  addDirectivePropertyMetadata(metadata: PropertyDirectiveMetadata) {
    const exist = this.fieldDirectives.some((directiveMetadata) => {
      return (
        directiveMetadata.fieldName === metadata.fieldName &&
        directiveMetadata.sdl === metadata.sdl &&
        directiveMetadata.target === metadata.target
      );
    });
    if (!exist) {
      this.fieldDirectives.push(metadata);
    }
  }

  addExtensionsMetadata(metadata: ClassExtensionsMetadata) {
    this.classExtensions.push(metadata);
  }

  addExtensionsPropertyMetadata(metadata: PropertyExtensionsMetadata) {
    this.fieldExtensions.push(metadata);
  }

  addResolverMetadata(metadata: ResolverClassMetadata) {
    this.resolvers.push(metadata);
  }

  addClassFieldMetadata(metadata: PropertyMetadata) {
    const existingMetadata = this.fields.find(
      (item) => item.target === metadata.target && item.name === metadata.name,
    );
    if (existingMetadata) {
      const options = existingMetadata.options;
      // inherit nullable option
      if (isUndefined(options.nullable) && isUndefined(options.defaultValue)) {
        options.nullable = metadata.options.nullable;
      }
    } else {
      this.fields.push(metadata);
    }
  }

  addMethodParamMetadata(metadata: MethodArgsMetadata) {
    this.params.push(metadata);
  }

  compile(orphanedTypes: (Function | object)[] = []) {
    this.classDirectives.reverse();
    this.classExtensions.reverse();
    this.fieldDirectives.reverse();
    this.fieldExtensions.reverse();

    const classMetadata = [
      ...this.objectTypes,
      ...this.inputTypes,
      ...this.argumentTypes,
      ...this.interfaces,
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

    orphanedTypes
      .forEach((type) => 'prototype' in type && this.applyPluginMetadata(type.prototype));
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
      const belongsToClass = isTargetEqual.bind(undefined, item);

      if (!item.properties) {
        item.properties = this.getClassFieldsByPredicate(belongsToClass);
      }
      if (!item.directives) {
        item.directives = this.classDirectives.filter(belongsToClass);
      }
      if (!item.extensions) {
        item.extensions = this.classExtensions
          .filter(belongsToClass)
          .reduce((curr, acc) => ({ ...curr, ...acc.value }), {});
      }
    });
  }

  clear() {
    Object.assign(this, new TypeMetadataStorageHost());
  }

  private getClassFieldsByPredicate(
    belongsToClass: (item: PropertyMetadata) => boolean,
  ) {
    const fields = this.fields.filter(belongsToClass);
    fields.forEach((field) => {
      const isHostEqual = isTargetEqual.bind(undefined, field);
      field.methodArgs = this.params.filter(
        (param) => isHostEqual(param) && field.name === param.methodName,
      );
      field.directives = this.fieldDirectives.filter(
        this.isFieldDirectiveOrExtension.bind(this, field),
      );
      field.extensions = this.fieldExtensions
        .filter(this.isFieldDirectiveOrExtension.bind(this, field))
        .reduce((curr, acc) => ({ ...curr, ...acc.value }), {});
    });
    return fields;
  }

  private compileResolversMetadata(metadata: BaseResolverMetadata[]) {
    metadata.forEach((item) => {
      const isTypeEqual = isTargetEqual.bind(undefined, item);
      const resolverMetadata = this.resolvers.find(isTypeEqual);

      item.classMetadata = resolverMetadata;
      item.methodArgs = this.params.filter(
        (param) => isTypeEqual(param) && item.methodName === param.methodName,
      );
      item.directives = this.fieldDirectives.filter(
        this.isFieldDirectiveOrExtension.bind(this, item),
      );
      item.extensions = this.fieldExtensions
        .filter(this.isFieldDirectiveOrExtension.bind(this, item))
        .reduce((curr, acc) => ({ ...curr, ...acc.value }), {});
    });
  }

  private compileFieldResolverMetadata(metadata: FieldResolverMetadata[]) {
    this.compileResolversMetadata(metadata);

    metadata.forEach((item) => {
      const belongsToClass = isTargetEqual.bind(undefined, item);
      item.directives = this.fieldDirectives.filter(
        this.isFieldDirectiveOrExtension.bind(this, item),
      );
      item.extensions = this.fieldExtensions
        .filter(this.isFieldDirectiveOrExtension.bind(this, item))
        .reduce((curr, acc) => ({ ...curr, ...acc.value }), {});

      item.objectTypeFn =
        item.kind === 'external'
          ? this.resolvers.find(belongsToClass).typeFn
          : () => item.target as Type<unknown>;

      if (item.kind === 'external') {
        this.compileExternalFieldResolverMetadata(item);
      }
    });
  }

  private compileExternalFieldResolverMetadata(item: FieldResolverMetadata) {
    const objectTypeRef = this.resolvers
      .find((el) => isTargetEqual(el, item))
      .typeFn();

    const objectOrInterfaceTypeMetadata =
      this.objectTypes.find(
        (objTypeDef) => objTypeDef.target === objectTypeRef,
      ) ||
      this.interfaces.find(
        (interfaceTypeDef) => interfaceTypeDef.target === objectTypeRef,
      );
    if (!objectOrInterfaceTypeMetadata) {
      throw new CannotDetermineHostTypeError(
        item.schemaName,
        objectTypeRef?.name,
      );
    }
    const objectOrInterfaceTypeField = objectOrInterfaceTypeMetadata.properties.find(
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
    this.resolvers.forEach((item) => {
      let parentClass = Object.getPrototypeOf(item.target);

      while (parentClass.prototype) {
        const parentMetadata = this.resolvers.find(
          (item) => item.target === parentClass,
        );
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

  private isFieldDirectiveOrExtension(
    host: Record<'target' | 'methodName' | 'name', any>,
    metadata: PropertyDirectiveMetadata | PropertyExtensionsMetadata,
  ): boolean {
    return (
      metadata.target === host.target &&
      metadata.fieldName === (host.methodName || host.name)
    );
  }

  private mergeParentResolverHandlers<
    T extends ResolverTypeMetadata | FieldResolverMetadata
  >(
    metadata: T[],
    parentClass: Function,
    classMetadata: ResolverClassMetadata,
  ): T[] {
    const mergedMetadata = metadata.map((metadata) => {
      return metadata.target !== parentClass
        ? metadata
        : {
            ...metadata,
            target: classMetadata.target,
            classMetadata,
          };
    });
    return mergedMetadata;
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
    const mergedMetadata = parentMetadata.map((metadata) => {
      return metadata.target === parentClass
        ? metadata
        : {
            ...metadata,
            objectTypeFn: isThrowing(metadata.objectTypeFn)
              ? classMetadata.typeFn
              : metadata.objectTypeFn,
          };
    });
    return mergedMetadata;
  }
}

const globalRef = global as any;
export const TypeMetadataStorage: TypeMetadataStorageHost =
  globalRef.GqlTypeMetadataStorage ||
  (globalRef.GqlTypeMetadataStorage = new TypeMetadataStorageHost());
