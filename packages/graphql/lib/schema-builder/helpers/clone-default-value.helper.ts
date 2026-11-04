import {
  GraphQLArgument,
  GraphQLInputField,
  GraphQLSchema,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
} from 'graphql';

/**
 * Returns a copy of a default value, so that what one request does to it
 * cannot change it for the next ones. Only plain arrays and plain objects
 * (and the plain arrays and objects they hold) are copied: class instances
 * (e.g., the internal value of a custom scalar) and primitives are returned
 * as they are.
 */
export function cloneDefaultValue<T>(value: T): T {
  return clonePlainValue(value, new Map());
}

function clonePlainValue<T>(value: T, copies: Map<unknown, unknown>): T {
  if (!isPlainArrayOrObject(value)) {
    return value;
  }
  if (copies.has(value)) {
    return copies.get(value) as T;
  }
  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    copies.set(value, copy);
    value.forEach((item) => copy.push(clonePlainValue(item, copies)));
    return copy as T;
  }
  const copy = Object.create(Object.getPrototypeOf(value));
  copies.set(value, copy);
  for (const key of Object.keys(value)) {
    copy[key] = clonePlainValue(value[key], copies);
  }
  return copy;
}

/**
 * graphql-js hands the default value of an argument or input field to every
 * operation that omits it by reference, so a resolver that changes such an
 * array or object in place (e.g., `input.tags.push(...)`) would change the
 * default of all later requests. Makes every array or object default of the
 * schema a getter that returns a copy of it (see `cloneDefaultValue()`).
 */
export function isolateDefaultValues(schema: GraphQLSchema): GraphQLSchema {
  for (const directive of schema.getDirectives()) {
    directive.args.forEach(isolateDefaultValue);
  }
  for (const type of Object.values(schema.getTypeMap())) {
    if (isObjectType(type) || isInterfaceType(type)) {
      for (const field of Object.values(type.getFields())) {
        field.args.forEach(isolateDefaultValue);
      }
    } else if (isInputObjectType(type)) {
      Object.values(type.getFields()).forEach(isolateDefaultValue);
    }
  }
  return schema;
}

function isolateDefaultValue(element: GraphQLArgument | GraphQLInputField) {
  let defaultValue = element.defaultValue;
  if (!isPlainArrayOrObject(defaultValue)) {
    return;
  }
  Object.defineProperty(element, 'defaultValue', {
    configurable: true,
    enumerable: true,
    get: () => cloneDefaultValue(defaultValue),
    set: (value: unknown) => {
      defaultValue = value;
    },
  });
}

function isPlainArrayOrObject(
  value: unknown,
): value is unknown[] | Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return (
    prototype === Array.prototype ||
    prototype === Object.prototype ||
    prototype === null
  );
}
