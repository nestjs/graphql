/**
 * Concatenates type definitions (strings) and arrays; merges any other two
 * values as objects, one level deep.
 *
 * Note: a type present in both of two resolver maps keeps only the resolvers
 * of the second one. Use "mergeResolvers" (from "@graphql-tools/merge") to
 * merge resolver maps field by field.
 */
export function extend(obj1: unknown, obj2: unknown): any {
  if (typeof obj1 === 'string') {
    const extraItems = obj2 == null ? [] : Array.isArray(obj2) ? obj2 : [obj2];
    return typeof obj2 === 'string'
      ? [obj1 ?? '', obj2 ?? '']
      : [obj1 ?? ''].concat(extraItems);
  }
  if (Array.isArray(obj1)) {
    const extraItems = obj2 == null ? [] : Array.isArray(obj2) ? obj2 : [obj2];
    return obj1.concat(extraItems);
  }
  return {
    ...((obj1 as object) || {}),
    ...((obj2 as object) || {}),
  };
}
