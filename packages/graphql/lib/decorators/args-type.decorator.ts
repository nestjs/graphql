import { ClassType } from '../enums/class-type.enum';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import { addClassTypeMetadata } from '../utils/add-class-type-metadata.util';

/**
 * Decorator that marks a class as a resolver arguments type.
 */
export function ArgsType(): ClassDecorator {
  return (target: Function) => {
    const metadata = {
      name: target.name,
      target,
    };
    LazyMetadataStorage.store(() =>
      TypeMetadataStorage.addArgsMetadata(metadata),
    );
    // This function must be called eagerly to allow resolvers
    // accessing the "name" property
    TypeMetadataStorage.addArgsMetadata(metadata);
    addClassTypeMetadata(target, ClassType.ARGS);
  };
}
