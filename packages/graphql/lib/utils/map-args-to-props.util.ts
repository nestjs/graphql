import { isUndefined } from '@nestjs/common/utils/shared.utils.js';
import { ARGS_TYPE_METADATA } from '../graphql.constants.js';
import { PropertyMetadata } from '../schema-builder/metadata/index.js';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage.js';

/**
 * What a single `@Args()` parameter declared, recorded at decoration time.
 */
export interface ArgsTypeMetadata {
  index: number;
  /**
   * Name of the single argument the parameter binds to, or `undefined` when the
   * parameter receives the whole arguments object.
   */
  property?: string;
  /**
   * Explicit `type` option passed to `@Args()`, if any.
   */
  typeFn?: () => any;
}

interface MappedProp {
  schemaName: string;
  name: string;
  typeRef?: Function;
}

interface ArgsMapperEntry {
  property?: string;
  classRef: Function;
}

const propsCache = new WeakMap<object, PropertyMetadata[]>();
const hasRenamedPropsCache = new WeakMap<object, boolean>();
const mappedPropsCache = new WeakMap<object, MappedProp[]>();

function getProps(classRef: Function): PropertyMetadata[] {
  if (propsCache.has(classRef)) {
    return propsCache.get(classRef);
  }
  const classesMetadata = [
    ...TypeMetadataStorage.getArgumentsMetadata(),
    ...TypeMetadataStorage.getInputTypesMetadata(),
  ];
  const properties: PropertyMetadata[] = [];

  let target = classRef;
  while (!isUndefined(target?.prototype)) {
    const classMetadata = classesMetadata.find(
      (item) => item.target === target,
    );
    if (classMetadata?.properties) {
      properties.push(...classMetadata.properties);
    }
    target = Object.getPrototypeOf(target);
  }
  propsCache.set(classRef, properties);
  return properties;
}

function hasRenamedProps(classRef: Function): boolean {
  if (hasRenamedPropsCache.has(classRef)) {
    return hasRenamedPropsCache.get(classRef);
  }
  // iterative instead of recursive, input types are allowed to reference each other
  const visited = new Set<Function>();
  const queue = [classRef];
  let hasRenamed = false;

  while (queue.length && !hasRenamed) {
    const current = queue.pop();
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    for (const { name, schemaName, typeFn } of getProps(current)) {
      if (schemaName !== name) {
        hasRenamed = true;
        break;
      }
      const typeRef = typeFn?.();
      if (typeof typeRef === 'function') {
        queue.push(typeRef);
      }
    }
  }
  hasRenamedPropsCache.set(classRef, hasRenamed);
  return hasRenamed;
}

function getMappedProps(classRef: Function): MappedProp[] {
  if (mappedPropsCache.has(classRef)) {
    return mappedPropsCache.get(classRef);
  }
  const mappedProps: MappedProp[] = [];
  getProps(classRef).forEach(({ name, schemaName, typeFn }) => {
    const typeRef = typeFn?.();
    const nestedTypeRef =
      typeof typeRef === 'function' && hasRenamedProps(typeRef)
        ? typeRef
        : undefined;

    if (schemaName !== name || nestedTypeRef) {
      mappedProps.push({ schemaName, name, typeRef: nestedTypeRef });
    }
  });
  mappedPropsCache.set(classRef, mappedProps);
  return mappedProps;
}

/**
 * Rewrites `value` so that every field renamed through `@Field({ name: '...' })`
 * is keyed by the property name its class declares instead of its schema name.
 *
 * The result is always a fresh object: reading the renamed fields from the
 * original `value` keeps chained renames (a property whose schema name is
 * another property's class name) from overwriting each other.
 */
export function mapArgsToProps(value: any, classRef: Function): any {
  const mappedProps = getMappedProps(classRef);
  if (!mappedProps.length || !value || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => mapArgsToProps(item, classRef));
  }
  const renamed = new Set(
    mappedProps
      .filter(({ schemaName, name }) => schemaName !== name)
      .map(({ schemaName }) => schemaName),
  );
  const mapped: Record<string, any> = {};

  for (const key of Object.keys(value)) {
    if (!renamed.has(key)) {
      mapped[key] = value[key];
    }
  }
  for (const { schemaName, name, typeRef } of mappedProps) {
    if (!(schemaName in value)) {
      continue;
    }
    mapped[name] = typeRef
      ? mapArgsToProps(value[schemaName], typeRef)
      : value[schemaName];
  }
  return mapped;
}

function resolveArgClass(
  { index, typeFn }: ArgsTypeMetadata,
  target: Function,
  methodName: string,
): Function | undefined {
  // The explicit `type` option wins: a list argument reflects as `Array`, which
  // tells us nothing about the element type.
  let typeRef = typeFn?.();
  while (Array.isArray(typeRef)) {
    typeRef = typeRef[0];
  }
  if (!typeRef) {
    const paramtypes: Function[] =
      Reflect.getMetadata('design:paramtypes', target.prototype, methodName) ??
      [];
    typeRef = paramtypes[index];
  }
  return typeof typeRef === 'function' ? typeRef : undefined;
}

/**
 * Builds the function that maps the raw GraphQL arguments of a single resolver
 * method onto the property names its `@Args()` classes declare, or `null` when
 * the method takes no arguments at all.
 *
 * The classes involved are resolved lazily, on the first call, because the
 * metadata this relies on is only complete once the schema has been built.
 */
export function createArgsMapper(
  target: Function,
  methodName: string,
): ((args: any) => any) | null {
  const argsTypes: ArgsTypeMetadata[] = Reflect.getMetadata(
    ARGS_TYPE_METADATA,
    target,
    methodName,
  );
  if (!argsTypes?.length) {
    return null;
  }
  let entries: ArgsMapperEntry[] | undefined;

  return (args: any) => {
    if (!entries) {
      entries = argsTypes
        .map((argsType) => ({
          property: argsType.property,
          classRef: resolveArgClass(argsType, target, methodName),
        }))
        .filter(
          ({ classRef }) => classRef && hasRenamedProps(classRef),
        ) as ArgsMapperEntry[];

      // Named arguments read from the incoming, schema-keyed object, so they
      // have to be mapped before a whole-object `@Args()` renames their keys.
      entries.sort((a, b) => Number(!a.property) - Number(!b.property));
    }
    if (!entries.length || !args || typeof args !== 'object') {
      return args;
    }
    let result = args;

    for (const { property, classRef } of entries) {
      if (!property) {
        result = mapArgsToProps(result, classRef);
        continue;
      }
      if (!(property in result)) {
        continue;
      }
      const mappedValue = mapArgsToProps(result[property], classRef);
      if (mappedValue !== result[property]) {
        result = result === args ? { ...result } : result;
        result[property] = mappedValue;
      }
    }
    return result;
  };
}
