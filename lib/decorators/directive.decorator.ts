import { parse } from 'graphql';
import { DirectiveParsingError } from '../schema-builder/errors/directive-parsing.error';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';

/**
 * Adds a directive to specified field, type, or handler.
 */
export function Directive(
  sdl: string,
): MethodDecorator & PropertyDecorator & ClassDecorator {
  return (target: Function | Object, key?: string | symbol) => {
    validateDirective(sdl);

    if (key) {
      TypeMetadataStorage.addDirectivePropertyMetadata({
        target: target.constructor,
        fieldName: key as string,
        sdl,
      });
    } else {
      TypeMetadataStorage.addDirectiveMetadata({
        target: target as Function,
        sdl,
      });
    }
  };
}

function validateDirective(sdl: string) {
  try {
    parse(`type String ${sdl}`);
  } catch (err) {
    throw new DirectiveParsingError(sdl);
  }
}
