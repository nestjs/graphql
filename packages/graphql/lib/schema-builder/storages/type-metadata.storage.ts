import { Logger, Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils.js';
import { addFieldMetadata } from '../../decorators/index.js';
import { RESOLVER_TYPE_METADATA } from '../../graphql.constants.js';
import { METADATA_FACTORY_NAME } from '../../plugin/plugin-constants.js';
import { MetadataByTargetCollection } from '../collections/index.js';
import { CannotDetermineHostTypeError } from '../errors/cannot-determine-host-type.error.js';
import { UndefinedResolverTypeError } from '../errors/undefined-resolver-type.error.js';
import { UndefinedTypeError } from '../errors/undefined-type.error.js';
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
  RegisterInOption,
  ResolverClassMetadata,
  ResolverTypeMetadata,
  UnionMetadata,
} from '../metadata/index.js';
import { InterfaceMetadata } from '../metadata/interface.metadata.js';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata.js';
import { getInterfacesArray } from '../utils/get-interfaces-array.util.js';
import { ResolverImplementationMap } from './resolver-implementation.map.js';

export class TypeMetadataStorageHost {
  private readonly logger = new Logger(TypeMetadataStorageHost.name);
  private queries = new Array<ResolverTypeMetadata>();
  private mutations = new Array<ResolverTypeMetadata>();
  private subscriptions = new Array<ResolverTypeMetadata>();
  private compiledResolvers?: {
    queries: Array<ResolverTypeMetadata>;
    mutations: Array<ResolverTypeMetadata>;
    subscriptions: Array<ResolverTypeMetadata>;
  };
  private fieldResolvers = new Array<FieldResolverMetadata>();
  private readonly enums = new Array<EnumMetadata>();
  private readonly unions = new Array<UnionMetadata>();
  private readonly metadataByTargetCollection =
    new MetadataByTargetCollection();

  addMutationMetadata(metadata: ResolverTypeMetadata) {
    this.mutations.push(metadata);
  }

  getMutationsMetadata(): ResolverTypeMetadata[] {
    return this.compiledResolvers?.mutations ?? this.mutations;
  }

  addQueryMetadata(metadata: ResolverTypeMetadata) {
    this.queries.push(metadata);
  }

  getQueriesMetadata(): ResolverTypeMetadata[] {
    return this.compiledResolvers?.queries ?? this.queries;
  }

  addSubscriptionMetadata(metadata: ResolverTypeMetadata) {
    this.subscriptions.push(metadata);
  }

  getSubscriptionsMetadata(): ResolverTypeMetadata[] {
    return this.compiledResolvers?.subscriptions ?? this.subscriptions;
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
    target: Function,
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

  private resolveRegisterIn(
    registerIn: RegisterInOption | undefined,
  ): Function | undefined {
    if (!registerIn) {
      return undefined;
    }
    const isClass =
      registerIn.prototype && registerIn.prototype.constructor === registerIn;
    if (isClass) {
      return registerIn;
    }
    // It's a factory function, call it to get the actual module
    try {
      return registerIn();
    } catch (error) {
      this.logger.warn(
        `Failed to resolve registerIn function. The type will be included in all schemas (backward compatible behavior). Error: ${error}`,
      );
      return undefined;
    }
  }

  private shouldIncludeInModules(
    registerIn: RegisterInOption | undefined,
    moduleSet: Set<Function>,
  ): boolean {
    const resolvedModule = this.resolveRegisterIn(registerIn);
    // Include if no registerIn specified (included in all schemas) or if in the module set
    return !resolvedModule || moduleSet.has(resolvedModule);
  }

  private filterByModules<T extends { registerIn?: RegisterInOption }>(
    metadata: T[],
    modules: Function[],
  ): T[] {
    const moduleSet = new Set(modules);
    return metadata.filter((item) =>
      this.shouldIncludeInModules(item.registerIn, moduleSet),
    );
  }

  getObjectTypesMetadataByModules(modules: Function[]): ObjectTypeMetadata[] {
    return this.filterByModules(
      this.metadataByTargetCollection.all.objectType,
      modules,
    );
  }

  getInputTypesMetadataByModules(modules: Function[]): ClassMetadata[] {
    return this.filterByModules(
      this.metadataByTargetCollection.all.inputType,
      modules,
    );
  }

  getInterfacesMetadataByModules(modules: Function[]): InterfaceMetadata[] {
    return this.filterByModules(
      [...this.metadataByTargetCollection.all.interface.values()],
      modules,
    );
  }

  getArgumentsMetadataByModules(modules: Function[]): ClassMetadata[] {
    return this.filterByModules(
      this.metadataByTargetCollection.all.argumentType,
      modules,
    );
  }

  getEnumsMetadataByModules(modules: Function[]): EnumMetadata[] {
    return this.filterByModules(this.enums, modules);
  }

  getUnionsMetadataByModules(modules: Function[]): UnionMetadata[] {
    return this.filterByModules(this.unions, modules);
  }

  addDirectiveMetadata(metadata: ClassDirectiveMetadata) {
    const classMetadata = this.metadataByTargetCollection.get(metadata.target);
    const isDuplicate = classMetadata.classDirectives
      .getAll()
      .some((directive) => directive.sdl === metadata.sdl);
    if (!isDuplicate) {
      // Class decorators are applied bottom-up: prepend to keep source order.
      classMetadata.classDirectives.unshift(metadata);
    }
  }

  addDirectivePropertyMetadata(metadata: PropertyDirectiveMetadata) {
    this.metadataByTargetCollection
      .get(metadata.target)
      .fieldDirectives.add(metadata);
  }

  addExtensionsMetadata(metadata: ClassExtensionsMetadata) {
    // Class decorators are applied bottom-up: prepend to keep source order.
    this.metadataByTargetCollection
      .get(metadata.target)
      .classExtensions.unshift(metadata);
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
      if (isUndefined(options.nullable) && isUndefined(options.defaultValue)) {
        options.nullable = metadata.options.nullable;
      }
      existingMetadata.description ??= metadata.description;
      existingMetadata.deprecationReason ??= metadata.deprecationReason;
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

  /**
   * Compiles the metadata registered so far for one schema.
   *
   * @param orphanedTypes types to load the plugin metadata of
   * @param resolvers the classes the schema is built for (`GraphQLSchemaFactory` passes the
   * providers the resolvers explorer binds). Field resolvers of other classes are left out, so
   * that several schemas can be built in one process (e.g. a `GraphQLModule` per endpoint with
   * `include`). Defaults to every registered resolver that is not abstract.
   */
  compile(orphanedTypes: (Function | object)[] = [], resolvers?: Function[]) {
    this.metadataByTargetCollection.compile();

    const classMetadata = [
      ...this.metadataByTargetCollection.all.objectType,
      ...this.metadataByTargetCollection.all.inputType,
      ...this.metadataByTargetCollection.all.argumentType,
      ...this.metadataByTargetCollection.all.interface.values(),
    ];
    this.loadClassPluginMetadata(classMetadata);
    // The fields are rebuilt from the declarations on every call, so the field resolvers placed
    // for a previous schema do not carry over to this one.
    this.compileClassMetadata(classMetadata, { overrideFields: true });

    const servingResolvers = this.getServingResolvers(resolvers);
    this.compileFieldResolverMetadata(this.fieldResolvers, servingResolvers);

    const resolversMetadata = [
      ...this.queries,
      ...this.mutations,
      ...this.subscriptions,
    ];
    this.compileResolversMetadata(resolversMetadata);
    this.compiledResolvers =
      this.compileExtendedResolversMetadata(servingResolvers);

    orphanedTypes.forEach(
      (type) => 'prototype' in type && this.applyPluginMetadata(type.prototype),
    );
  }

  loadClassPluginMetadata(metadata: ClassMetadata[]) {
    const loadedClasses = new Set<Function>();
    metadata
      .filter((item) => item?.target)
      .forEach((item) =>
        this.applyPluginMetadata(item.target.prototype, loadedClasses),
      );
  }

  applyPluginMetadata(
    prototype: Function,
    loadedClasses = new Set<Function>(),
  ) {
    do {
      if (!prototype.constructor) {
        return;
      }
      // Skip redundant metadata merges for common parents.
      if (loadedClasses.has(prototype.constructor)) {
        return;
      }
      loadedClasses.add(prototype.constructor);

      const metadata = Object.getOwnPropertyDescriptor(
        prototype.constructor,
        METADATA_FACTORY_NAME,
      )?.value?.();
      if (!metadata) {
        continue;
      }
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

  compileClassMetadata(
    metadata: ClassMetadata[],
    options?: { overrideFields?: boolean },
  ) {
    metadata.forEach((item) => {
      if (!item.properties || options?.overrideFields) {
        item.properties = this.getClassFieldsByPredicate(item);
      }
      if (!item.directives) {
        item.directives = this.getInheritedClassDirectives(item.target);
      }
      if (!item.extensions) {
        item.extensions = this.getInheritedClassExtensions(item.target);
      }
    });
  }

  /**
   * Class-level extensions of `target` and its ancestors, like class directives. A key the class
   * (or a nearer ancestor) sets again overrides the inherited value.
   */
  private getInheritedClassExtensions(
    target: Function,
  ): Record<string, unknown> {
    const classRefs: Function[] = [];
    for (
      let current = target;
      current && current !== Function.prototype;
      current = Object.getPrototypeOf(current)
    ) {
      classRefs.unshift(current);
    }
    return classRefs.reduce(
      (extensions, classRef) =>
        this.metadataByTargetCollection
          .get(classRef)
          .classExtensions.reduce(
            (curr, acc) => ({ ...curr, ...acc.value }),
            extensions,
          ),
      {} as Record<string, unknown>,
    );
  }

  private getInheritedClassDirectives(
    target: Function,
  ): ClassDirectiveMetadata[] {
    const ownDirectives = this.metadataByTargetCollection
      .get(target)
      .classDirectives.getAll();

    const inherited: ClassDirectiveMetadata[] = [];
    const seenSdls = new Set<string>(ownDirectives.map((d) => d.sdl));

    let current: Function | null = Object.getPrototypeOf(target);
    while (current && current !== Function.prototype) {
      this.metadataByTargetCollection
        .get(current)
        .classDirectives.getAll()
        .forEach((directive) => {
          if (!seenSdls.has(directive.sdl)) {
            seenSdls.add(directive.sdl);
            inherited.push(directive);
          }
        });
      current = Object.getPrototypeOf(current);
    }

    // Preserve the shared-reference semantic when nothing is inherited:
    // `item.directives` is expected to stay in sync with the per-target
    // `classDirectives` array, which directives registered later are
    // prepended to. Only produce a fresh array when we actually have to
    // combine directives from an abstract parent.
    return inherited.length === 0
      ? ownDirectives
      : [...ownDirectives, ...inherited];
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

  /**
   * Places every `@ResolveField()` on the types its handler is bound on in this schema.
   *
   * The resolvers explorer reads a handler from the prototype of each provider and binds it on that
   * provider's `@Resolver()` type, so a handler is bound once per serving resolver class that
   * declares or inherits it, and an override further down the chain is a declaration of its own.
   * Each such type gets its own copy of the field, so the declaration the handler resolves (on the
   * type, an ancestor or an implemented interface) and the other types sharing it are left as they
   * are.
   */
  private compileFieldResolverMetadata(
    metadata: FieldResolverMetadata[],
    servingResolvers: Function[],
  ) {
    this.compileResolversMetadata(metadata);

    const resolversByBaseClass =
      this.groupResolversByBaseClass(servingResolvers);
    const handlersByHost = new Map<
      ClassMetadata,
      Map<string, FieldResolverMetadata>
    >();
    metadata
      .filter((item) => item.kind === 'external')
      .forEach((item) => {
        const resolvers = (resolversByBaseClass.get(item.target) ?? []).filter(
          (resolver) => this.isHandlerServedBy(item, resolver),
        );
        resolvers.forEach((resolver) => {
          const host = this.getResolverHostMetadata(resolver, item);
          if (!host) {
            return;
          }
          let handlers = handlersByHost.get(host);
          if (!handlers) {
            handlers = new Map();
            handlersByHost.set(host, handlers);
          }
          // As at run time, the most derived declaration of a field wins.
          const current = handlers.get(item.schemaName);
          if (!current || !item.target.isPrototypeOf(current.target)) {
            handlers.set(item.schemaName, item);
          }
        });
      });

    handlersByHost.forEach((handlers, host) => {
      const properties = [...host.properties];
      handlers.forEach((item, schemaName) => {
        const declaredField = this.findDeclaredField(host.target, schemaName);
        const field = declaredField
          ? this.mergeFieldResolverMetadata(declaredField, item)
          : this.createFieldResolverProperty(item, host.target);

        const index = properties.findIndex(
          (property) => property.schemaName === schemaName,
        );
        if (index === -1) {
          properties.push(field);
        } else {
          properties[index] = field;
        }
      });
      host.properties = properties;
    });
  }

  /**
   * A copy of the declared `field` for one host type, with the handler's own metadata applied over
   * the declaration's. The declaration is shared with every type that inherits it (and with an
   * `@InputType()` on the same class), so it is never written to.
   */
  private mergeFieldResolverMetadata(
    field: PropertyMetadata,
    item: FieldResolverMetadata,
  ): PropertyMetadata {
    const directives = field.directives ?? [];
    const nullable = item.typeOptions?.nullable;
    if (!isUndefined(nullable)) {
      // An explicit type function records "isArray" on its options the first time it is called.
      field.typeFn();
    }
    return {
      ...field,
      options: isUndefined(nullable)
        ? field.options
        : { ...field.options, nullable },
      description: item.description ?? field.description,
      deprecationReason: item.deprecationReason ?? field.deprecationReason,
      complexity: item.complexity ?? field.complexity,
      methodArgs:
        item.methodArgs?.length > 0 ? item.methodArgs : field.methodArgs,
      directives: [
        ...directives,
        ...(item.directives ?? []).filter(
          (directive) => !directives.some(({ sdl }) => sdl === directive.sdl),
        ),
      ],
      extensions: { ...field.extensions, ...item.extensions },
    };
  }

  /** A field that only the handler declares. */
  private createFieldResolverProperty(
    item: FieldResolverMetadata,
    host: Function,
  ): PropertyMetadata {
    if (!item.typeFn || !item.typeOptions) {
      throw new UndefinedTypeError(item.target.name, item.methodName);
    }
    return {
      name: item.methodName,
      schemaName: item.schemaName,
      deprecationReason: item.deprecationReason,
      description: item.description,
      typeFn: item.typeFn,
      target: host,
      options: item.typeOptions,
      methodArgs: item.methodArgs,
      directives: item.directives,
      extensions: item.extensions,
      complexity: item.complexity,
    };
  }

  /**
   * The field `schemaName` as declared on `target`, an ancestor class or an implemented interface,
   * nearest first.
   */
  private findDeclaredField(
    target: Function,
    schemaName: string,
    visited = new Set<Function>(),
  ): PropertyMetadata | undefined {
    for (
      let classRef = target;
      classRef?.prototype && !visited.has(classRef);
      classRef = Object.getPrototypeOf(classRef)
    ) {
      visited.add(classRef);
      const typeMetadata = this.getObjectOrInterfaceMetadata(classRef);
      if (!typeMetadata) {
        continue;
      }
      const field = this.metadataByTargetCollection
        .get(classRef)
        .fields.getAll()
        .find((property) => property.schemaName === schemaName);
      if (field) {
        return field;
      }
      for (const interfaceRef of getInterfacesArray(
        (typeMetadata as ObjectTypeMetadata).interfaces,
      )) {
        const interfaceField = this.findDeclaredField(
          interfaceRef,
          schemaName,
          visited,
        );
        if (interfaceField) {
          return interfaceField;
        }
      }
    }
    return undefined;
  }

  /**
   * The object or interface type `resolver` binds its field resolvers on. As in the resolvers
   * explorer, that is the `@Resolver()` type of the nearest class in its chain that declares one.
   */
  private getResolverHostMetadata(
    resolver: Function,
    item: FieldResolverMetadata,
  ): ClassMetadata | undefined {
    let classRef = resolver;
    while (
      classRef?.prototype &&
      !Reflect.hasOwnMetadata(RESOLVER_TYPE_METADATA, classRef)
    ) {
      classRef = Object.getPrototypeOf(classRef);
    }
    const typeName: string | undefined = classRef?.prototype
      ? Reflect.getOwnMetadata(RESOLVER_TYPE_METADATA, classRef)
      : undefined;
    if (!typeName) {
      // A bare `@Resolver()`: the resolvers explorer binds none of its field resolvers.
      if (resolver === item.target) {
        throw new UndefinedResolverTypeError(resolver.name);
      }
      return undefined;
    }

    // A resolver typed by name (e.g. `@Resolver('Cat')`) records no type function.
    const typeFn =
      this.metadataByTargetCollection.get(classRef).resolver?.typeFn;
    const typeRef = typeFn?.();
    const typeMetadata = typeRef
      ? this.getObjectOrInterfaceMetadata(typeRef)
      : this.getObjectOrInterfaceMetadataByName(typeName);
    if (!typeMetadata) {
      throw new CannotDetermineHostTypeError(
        item.schemaName,
        typeRef?.name ?? typeName,
      );
    }
    return typeMetadata;
  }

  private getObjectOrInterfaceMetadata(
    target: Function,
  ): ClassMetadata | undefined {
    const metadata = this.metadataByTargetCollection.get(target);
    return metadata.objectType || metadata.interface;
  }

  private getObjectOrInterfaceMetadataByName(
    name: string,
  ): ClassMetadata | undefined {
    return (
      this.metadataByTargetCollection.all.objectType.find(
        (metadata) => metadata.name === name,
      ) ??
      [...this.metadataByTargetCollection.all.interface.values()].find(
        (metadata) => metadata.name === name,
      )
    );
  }

  /**
   * The classes a schema is built for: the ones passed to `compile()`, else every registered
   * resolver that is not abstract.
   */
  private getServingResolvers(resolvers?: Function[]): Function[] {
    const classes =
      resolvers ??
      this.metadataByTargetCollection.all.resolver
        .filter((resolver) => !resolver.isAbstract)
        .map((resolver) => resolver.target);
    return [...new Set(classes.filter(Boolean))];
  }

  /** Maps every class to the serving resolvers that are, or extend, that class. */
  private groupResolversByBaseClass(resolvers: Function[]) {
    const resolversByBaseClass = new Map<Function, Function[]>();
    resolvers.forEach((resolver) => {
      for (
        let classRef = resolver;
        classRef?.prototype;
        classRef = Object.getPrototypeOf(classRef)
      ) {
        const group = resolversByBaseClass.get(classRef);
        if (group) {
          group.push(resolver);
        } else {
          resolversByBaseClass.set(classRef, [resolver]);
        }
      }
    });
    return resolversByBaseClass;
  }

  /**
   * True when `resolver` runs the method `handler` is declared on, i.e. no class in between
   * overrides it. The resolvers explorer reads handlers from the instance's prototype, so the most
   * derived declaration is the only one it binds.
   */
  private isHandlerServedBy(handler: BaseResolverMetadata, resolver: Function) {
    return (
      resolver.prototype[handler.methodName] ===
      handler.target.prototype[handler.methodName]
    );
  }

  /**
   * Reassigns every handler declared on a base class to the resolver class that implements it. See
   * {@link ResolverImplementationMap} for why that is necessary. A handler that resolver overrides
   * keeps its own class: the override is what the resolvers explorer binds there.
   */
  private compileExtendedResolversMetadata(servingResolvers: Function[]) {
    const servingResolverSet = new Set(servingResolvers);
    const implementations = new ResolverImplementationMap(
      this.metadataByTargetCollection.all.resolver.filter((resolver) =>
        servingResolverSet.has(resolver.target),
      ),
      [this.queries, this.mutations, this.subscriptions, this.fieldResolvers],
    );

    if (implementations.isEmpty) {
      return {
        queries: this.queries,
        mutations: this.mutations,
        subscriptions: this.subscriptions,
      };
    }

    const collectAllMetadata = (handlers: ResolverTypeMetadata[]) =>
      handlers.map((handler) => {
        const classMetadata =
          implementations.getResolverImplementationForBaseClass(handler.target);
        return classMetadata &&
          this.isHandlerServedBy(handler, classMetadata.target)
          ? { ...handler, target: classMetadata.target, classMetadata }
          : handler;
      });

    return {
      queries: collectAllMetadata(this.queries),
      mutations: collectAllMetadata(this.mutations),
      subscriptions: collectAllMetadata(this.subscriptions),
    };
  }
}

const globalRef = global as any;
export const TypeMetadataStorage: TypeMetadataStorageHost =
  globalRef.GqlTypeMetadataStorage ||
  (globalRef.GqlTypeMetadataStorage = new TypeMetadataStorageHost());
