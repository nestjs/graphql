import { IResolvers } from '@graphql-tools/utils';
import { Logger } from '@nestjs/common';
import {
  GraphQLError,
  GraphQLFieldResolver,
  GraphQLNamedType,
  GraphQLSchema,
  isInterfaceType,
  isObjectType,
} from 'graphql';
import { getUseFieldMiddleware } from '../decorators/use-field-middleware.decorator.js';
import { FIELD_RESOLVER_COMPOSITION_METADATA } from '../graphql.constants.js';
import { FieldMiddleware } from '../interfaces/index.js';
import { PropertyMetadata } from '../schema-builder/metadata/index.js';
import { ObjectTypeMetadata } from '../schema-builder/metadata/object-type.metadata.js';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage.js';
import { getInterfacesArray } from '../schema-builder/utils/get-interfaces-array.util.js';
import { decorateFieldResolverWithMiddleware } from './decorate-field-resolver.util.js';

/**
 * Metadata that a field resolver decorated with field middleware can carry
 * (see "FIELD_RESOLVER_COMPOSITION_METADATA"): the resolver without any
 * middleware, and the middleware of the handler itself (global middleware
 * excluded). It lets the middleware of a model field run between the two, so
 * that the global middleware still runs first.
 */
interface FieldResolverComposition {
  resolve: (...args: unknown[]) => unknown;
  middleware: FieldMiddleware[];
}

type FieldResolver = GraphQLFieldResolver<unknown, unknown>;
type HasResolverFn = (typeName: string, fieldName: string) => boolean;

export interface FieldResolverBinderOptions {
  /**
   * The schema that the resolvers were added to (e.g., with
   * "makeExecutableSchema()"). The resolvers bound to the fields are read from
   * it when the binder is created, so its fields may be rebound afterwards.
   */
  executableSchema: GraphQLSchema;
  /**
   * The resolvers that were added to "executableSchema".
   */
  resolvers: IResolvers;
  /**
   * Returns a type of the auto-generated (code-first) schema.
   */
  getType: (typeName: string) => GraphQLNamedType | undefined;
  /**
   * The global field middleware ("buildSchemaOptions.fieldMiddleware").
   */
  globalMiddleware: FieldMiddleware[];
}

/**
 * Binds the field resolvers to the fields of the object types of a code-first
 * schema. "GraphQLFactory" and "GraphQLFederationFactory" both use it, so that
 * a field is bound the same way on every driver.
 */
export function createFieldResolverBinder({
  executableSchema,
  resolvers,
  getType,
  globalMiddleware,
}: FieldResolverBinderOptions) {
  const getExecutableResolve = getFieldResolvers(executableSchema);
  const metadataByName = getTypeMetadataByName();
  const resolverOnlyFields = getResolverOnlyFields();
  const isResolverOnlyField = (field: PropertyMetadata) =>
    resolverOnlyFields.typeFns.has(field.typeFn);

  /**
   * The supertypes of a type are the interfaces it implements and the
   * (object or interface) type its class extends
   */
  const getSupertypes = (typeName: string): string[] => {
    const type = getType(typeName);
    if (!isObjectType(type) && !isInterfaceType(type)) {
      return [];
    }
    const supertypes = type.getInterfaces().map(({ name }) => name);
    const parentMetadata = getParentTypeMetadata(
      metadataByName.get(typeName),
      ({ name }) => !!getType(name),
    );
    if (parentMetadata) {
      supertypes.push(parentMetadata.name);
    }
    return supertypes;
  };
  const findResolverHost = createResolverHostLookup(
    getSupertypes,
    (typeName, fieldName) =>
      hasOwnResolver(resolvers, typeName, fieldName) &&
      !!getExecutableResolve(typeName, fieldName),
  );
  const unboundFields: string[] = [];

  return {
    /**
     * Returns the resolver to bind to a field of an object type (other than
     * a root type), or "undefined" to keep the one the field has:
     * - the resolver of the type itself or, if it has none, the one of its
     *   most specific supertype (interfaces and parent classes), along with
     *   the middleware that the model declares for the field;
     * - or else the resolver returned by "fallback";
     * - or else, for a field that only a field resolver declares (the model
     *   has no such field), a resolver that throws: such a field must not
     *   fall back to the parent's property (fail closed).
     */
    getFieldResolver(
      typeName: string,
      fieldName: string,
      fallback?: () => FieldResolver | undefined,
    ): FieldResolver | undefined {
      const metadata = metadataByName.get(typeName);
      const hostName = findResolverHost(typeName, fieldName);
      if (hostName) {
        return withModelFieldMiddleware(
          getExecutableResolve(hostName, fieldName),
          getRawResolver(resolvers, hostName, fieldName),
          metadata
            ? getModelFieldMiddleware(metadata, fieldName, isResolverOnlyField)
            : [],
          globalMiddleware,
        );
      }
      const fallbackResolve = fallback?.();
      if (fallbackResolve) {
        return fallbackResolve;
      }
      const fieldMetadata =
        metadata &&
        resolverOnlyFields.names.has(fieldName) &&
        findFieldMetadata(metadata, fieldName);
      if (fieldMetadata && isResolverOnlyField(fieldMetadata)) {
        unboundFields.push(`"${typeName}.${fieldName}"`);
        return createUnboundFieldResolver(typeName, fieldName);
      }
      return undefined;
    },

    /**
     * Logs the fields bound to a resolver that throws (see "getFieldResolver()").
     */
    warnUnboundFields(logger: Logger) {
      if (unboundFields.length > 0) {
        logger.warn(
          `No resolver is bound for these fields, which are declared only by a field resolver (@ResolveField()): ${unboundFields.join(
            ', ',
          )}. Selecting them throws an error.`,
        );
      }
    },
  };
}

/**
 * "@graphql-tools/schema" lets the interface that a type lists last win, so
 * a base interface listed after an interface that implements it replaces the
 * resolver of the more specific interface (and the guards wrapped around it).
 * Binds the resolver of the most specific interface instead.
 */
export function inheritResolversFromInterfaces(
  schema: GraphQLSchema,
  resolvers: IResolvers,
) {
  const hasResolver: HasResolverFn = (typeName, fieldName) =>
    hasOwnResolver(resolvers, typeName, fieldName) &&
    !!getFieldResolve(schema, typeName, fieldName);
  const findResolverHost = createResolverHostLookup((typeName) => {
    const type = schema.getType(typeName);
    return isObjectType(type) || isInterfaceType(type)
      ? type.getInterfaces().map(({ name }) => name)
      : [];
  }, hasResolver);

  Object.values(schema.getTypeMap())
    .filter(isObjectType)
    .forEach((type) => {
      const interfaces = type.getInterfaces();
      Object.entries(type.getFields()).forEach(([fieldName, field]) => {
        const hostName = findResolverHost(type.name, fieldName);
        const listedLast = [...interfaces]
          .reverse()
          .find((interfaceRef) => hasResolver(interfaceRef.name, fieldName));
        if (hostName !== type.name && hostName !== listedLast?.name) {
          field.resolve = getFieldResolve(schema, hostName, fieldName);
        }
      });
    });
}

/**
 * Returns a function that finds the type whose resolver of a field is bound
 * to a type: the type itself if it has one or else, among its supertypes
 * that have one, the most specific. Among unrelated supertypes, the parent
 * class wins over interfaces, and the interface listed last wins over the others.
 */
function createResolverHostLookup(
  getSupertypes: (typeName: string) => string[],
  hasResolver: HasResolverFn,
) {
  const ancestorsByType = new Map<string, string[]>();
  const getAncestors = (typeName: string): string[] => {
    if (!ancestorsByType.has(typeName)) {
      const ancestors: string[] = [];
      const queue = [typeName];
      while (queue.length > 0) {
        for (const supertype of getSupertypes(queue.shift())) {
          if (supertype !== typeName && !ancestors.includes(supertype)) {
            ancestors.push(supertype);
            queue.push(supertype);
          }
        }
      }
      ancestorsByType.set(typeName, ancestors);
    }
    return ancestorsByType.get(typeName);
  };

  return (typeName: string, fieldName: string): string | undefined => {
    if (hasResolver(typeName, fieldName)) {
      return typeName;
    }
    const candidates = getAncestors(typeName).filter((ancestor) =>
      hasResolver(ancestor, fieldName),
    );
    const mostSpecific = candidates.filter(
      (candidate) =>
        !candidates.some((other) => getAncestors(other).includes(candidate)),
    );
    return mostSpecific[mostSpecific.length - 1];
  };
}

function hasOwnResolver(
  resolvers: IResolvers,
  typeName: string,
  fieldName: string,
): boolean {
  const typeResolvers = resolvers[typeName];
  return (
    typeof typeResolvers === 'object' &&
    typeResolvers !== null &&
    Object.prototype.hasOwnProperty.call(typeResolvers, fieldName) &&
    typeResolvers[fieldName] != null
  );
}

function getRawResolver(
  resolvers: IResolvers,
  typeName: string,
  fieldName: string,
): unknown {
  const resolver = (resolvers[typeName] as Record<string, any>)?.[fieldName];
  return typeof resolver === 'function' ? resolver : resolver?.resolve;
}

function getFieldResolve(
  schema: GraphQLSchema,
  typeName: string,
  fieldName: string,
): FieldResolver | undefined {
  const type = schema.getType(typeName);
  return isObjectType(type) || isInterfaceType(type)
    ? type.getFields()[fieldName]?.resolve
    : undefined;
}

/**
 * Returns a lookup of the resolvers bound to the fields of the object and
 * interface types of a schema, as they are now.
 */
function getFieldResolvers(schema: GraphQLSchema) {
  const resolveByField = new Map<string, FieldResolver>();
  for (const type of Object.values(schema.getTypeMap())) {
    if (isObjectType(type) || isInterfaceType(type)) {
      for (const [fieldName, field] of Object.entries(type.getFields())) {
        if (field.resolve) {
          resolveByField.set(`${type.name}.${fieldName}`, field.resolve);
        }
      }
    }
  }
  return (typeName: string, fieldName: string): FieldResolver | undefined =>
    resolveByField.get(`${typeName}.${fieldName}`);
}

/**
 * Wraps the resolver bound to a field with the middleware that the model
 * declares for that field (which the resolver generated for the field runs
 * too), instead of dropping that middleware.
 */
function withModelFieldMiddleware(
  resolve: FieldResolver,
  rawResolver: unknown,
  modelMiddleware: FieldMiddleware[],
  globalMiddleware: FieldMiddleware[],
): FieldResolver {
  if (modelMiddleware.length === 0) {
    return resolve;
  }
  const composition: FieldResolverComposition | undefined =
    typeof rawResolver === 'function'
      ? Reflect.getMetadata(FIELD_RESOLVER_COMPOSITION_METADATA, rawResolver)
      : undefined;
  if (!composition) {
    return decorateFieldResolverWithMiddleware(
      (...args) =>
        () =>
          resolve(...args),
      modelMiddleware,
    );
  }
  // The global middleware first, then the model's and the handler's, each once
  return decorateFieldResolverWithMiddleware(
    (...args) =>
      () =>
        composition.resolve(...args),
    [
      ...globalMiddleware,
      ...modelMiddleware.filter(
        (middleware) => !composition.middleware.includes(middleware),
      ),
      ...composition.middleware,
    ],
  );
}

function createUnboundFieldResolver(
  typeName: string,
  fieldName: string,
): FieldResolver {
  return () => {
    throw new GraphQLError(
      `No resolver is bound for field "${typeName}.${fieldName}".`,
    );
  };
}

function getTypeMetadataByName(): Map<string, ObjectTypeMetadata> {
  const metadataByName = new Map<string, ObjectTypeMetadata>();
  const metadata = [
    ...TypeMetadataStorage.getObjectTypesMetadata(),
    ...TypeMetadataStorage.getInterfacesMetadata(),
  ];
  for (const item of metadata) {
    if (!item.isAbstract && !metadataByName.has(item.name)) {
      metadataByName.set(item.name, item);
    }
  }
  return metadataByName;
}

/**
 * Returns the "typeFn" (and the names) of the fields that the field
 * resolvers add to a type when the model declares no field of that name.
 */
function getResolverOnlyFields() {
  const fieldResolvers = TypeMetadataStorage.getFieldResolversMetadata().filter(
    (item) => item.kind === 'external' && item.typeFn,
  );
  return {
    typeFns: new Set<Function>(fieldResolvers.map((item) => item.typeFn)),
    names: new Set(fieldResolvers.map((item) => item.schemaName)),
  };
}

/**
 * Returns the metadata of the nearest class up the prototype chain that is
 * an object or an interface type (and matches the predicate).
 */
function getParentTypeMetadata(
  metadata: ObjectTypeMetadata | undefined,
  predicate: (metadata: ObjectTypeMetadata) => boolean = () => true,
): ObjectTypeMetadata | undefined {
  let parent = metadata && Object.getPrototypeOf(metadata.target);
  while (parent && parent !== Function.prototype) {
    const parentMetadata =
      TypeMetadataStorage.getObjectTypeMetadataByTarget(parent) ??
      TypeMetadataStorage.getInterfaceMetadataByTarget(parent);
    if (parentMetadata && predicate(parentMetadata)) {
      return parentMetadata;
    }
    parent = Object.getPrototypeOf(parent);
  }
  return undefined;
}

function getInterfacesMetadata(
  metadata: ObjectTypeMetadata,
): ObjectTypeMetadata[] {
  const interfaces: ObjectTypeMetadata[] = [];
  const queue = [metadata];
  while (queue.length > 0) {
    for (const target of getInterfacesArray(queue.shift().interfaces)) {
      const item = TypeMetadataStorage.getInterfaceMetadataByTarget(target);
      if (item && !interfaces.includes(item)) {
        interfaces.push(item);
        queue.push(item);
      }
    }
  }
  return interfaces;
}

/**
 * Returns the nearest declaration of a field that matches the predicate:
 * the type's own, or else an interface's, or else the parent class's.
 */
function findFieldMetadata(
  metadata: ObjectTypeMetadata,
  fieldName: string,
  predicate: (field: PropertyMetadata) => boolean = () => true,
): PropertyMetadata | undefined {
  const visited = new Set<ObjectTypeMetadata>();
  for (
    let current = metadata;
    current && !visited.has(current);
    current = getParentTypeMetadata(current)
  ) {
    visited.add(current);
    for (const item of [current, ...getInterfacesMetadata(current)]) {
      const field = [...(item.properties ?? [])]
        .reverse()
        .find(
          (property) =>
            property.schemaName === fieldName && predicate(property),
        );
      if (field) {
        return field;
      }
    }
  }
  return undefined;
}

/**
 * Returns the middleware that the model declares for a field with
 * "@Field({ middleware })" and "@UseFieldMiddleware()" (no global middleware).
 */
function getModelFieldMiddleware(
  metadata: ObjectTypeMetadata,
  fieldName: string,
  isResolverOnlyField: (field: PropertyMetadata) => boolean,
): FieldMiddleware[] {
  const field = findFieldMetadata(
    metadata,
    fieldName,
    (property) => !isResolverOnlyField(property),
  );
  return field
    ? (field.middleware ?? []).concat(
        getUseFieldMiddleware(field.target?.prototype, field.name),
      )
    : [];
}
