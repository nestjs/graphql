import { SetMetadata } from "@nestjs/common";

/**
 * Designates an instance method as a type resolver for an object type
 */
export const RESOLVE_OBJECT_TYPE_METADATA = 'graphql:resolve_object_type';
export function ResolveObjectType(): MethodDecorator {
  return (
    target: Function | Object,
    key?: string | symbol,
    descriptor?: any,
  ) => {
    SetMetadata(RESOLVE_OBJECT_TYPE_METADATA, true)(target, key, descriptor);
  };
}
