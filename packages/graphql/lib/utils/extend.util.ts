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
