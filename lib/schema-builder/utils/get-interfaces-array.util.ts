import { isFunction } from '@nestjs/common/utils/shared.utils';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata';

function isNativeClass(fn: Function) {
  return (
    typeof fn === 'function' &&
    /^class\s/.test(Function.prototype.toString.call(fn))
  );
}

export function getInterfacesArray(
  interfaces: ObjectTypeMetadata['interfaces'],
): Function[] {
  if (!interfaces) {
    return [];
  }
  if (Array.isArray(interfaces)) {
    return interfaces;
  }
  if (isFunction(interfaces) && !isNativeClass(interfaces)) {
    interfaces = (interfaces as Function)();
  }
  return [].concat(interfaces);
}
