import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';

/**
 * Adds arbitrary data accessible through the "extensions" property to specified field, type, or handler.
 */
export function Extensions(
  value: Record<string, unknown>,
): MethodDecorator & ClassDecorator & PropertyDecorator {
  return (target: Function | object, propertyKey?: string | symbol) => {
    LazyMetadataStorage.store(() => {
      if (propertyKey) {
        TypeMetadataStorage.addExtensionsPropertyMetadata({
          target: target.constructor,
          fieldName: propertyKey as string,
          value,
        });
      } else {
        TypeMetadataStorage.addExtensionsMetadata({
          target: target as Function,
          value,
        });
      }
    });
  };
}
