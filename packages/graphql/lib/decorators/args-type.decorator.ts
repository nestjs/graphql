import { ClassType } from '../enums/class-type.enum';
import { RegisterInOption } from '../schema-builder/metadata';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import { addClassTypeMetadata } from '../utils/add-class-type-metadata.util';

/**
 * Interface defining options that can be passed to `@ArgsType()` decorator.
 *
 * @publicApi
 */
export interface ArgsTypeOptions {
  /**
   * NestJS module that this type belongs to.
   * When specified, this type will only be included in GraphQL schemas
   * that include this module via the `include` option.
   * @see RegisterInOption for details
   */
  registerIn?: RegisterInOption;
}

/**
 * Decorator that marks a class as a resolver arguments type.
 *
 * @publicApi
 */
export function ArgsType(): ClassDecorator;
/**
 * Decorator that marks a class as a resolver arguments type.
 *
 * @publicApi
 */
export function ArgsType(options: ArgsTypeOptions): ClassDecorator;
/**
 * Decorator that marks a class as a resolver arguments type.
 *
 * @publicApi
 */
export function ArgsType(options?: ArgsTypeOptions): ClassDecorator {
  return (target: Function) => {
    const metadata = {
      name: target.name,
      target,
      registerIn: options?.registerIn,
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
