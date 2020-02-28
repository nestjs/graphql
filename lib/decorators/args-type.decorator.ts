import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';

/**
 * Decorator that marks a class as a resolver arguments type.
 */
export function ArgsType(): ClassDecorator {
  return (target: Function) => {
    const metadata = {
      name: target.name,
      target,
    };
    TypeMetadataStorage.addArgsMetadata(metadata);
  };
}
