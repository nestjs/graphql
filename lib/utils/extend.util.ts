import { defaultTo, isArray, isString } from 'lodash';

export function extend(obj1: any, obj2: any) {
  if (isString(obj1)) {
    return isString(obj2)
      ? [defaultTo(obj1, ''), defaultTo(obj2, '')]
      : [defaultTo(obj1, '')].concat(defaultTo(obj2, []));
  }
  if (isArray(obj1)) {
    return defaultTo(obj1, []).concat(defaultTo(obj2, []));
  }
  return {
    ...(obj1 || {}),
    ...(obj2 || {}),
  };
}
