import { parse } from 'graphql';
import { DirectiveParsingError } from '../schema-builder/errors/directive-parsing.error';
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';

/**
 * Adds one or more directives to a field, type, or handler. Passing an array
 * attaches every directive in a single decorator call, equivalent to stacking
 * multiple `@Directive(...)` decorators.
 *
 * @publicApi
 */
export function Directive(
  sdl: string | string[],
): MethodDecorator & PropertyDecorator & ClassDecorator {
  const sdls = Array.isArray(sdl) ? sdl : [sdl];
  sdls.forEach(validateDirective);

  return (target: Function | object, key?: string | symbol) => {
    LazyMetadataStorage.store(() => {
      sdls.forEach((singleSdl) => {
        if (key) {
          TypeMetadataStorage.addDirectivePropertyMetadata({
            target: target.constructor,
            fieldName: key as string,
            sdl: singleSdl,
          });
        } else {
          TypeMetadataStorage.addDirectiveMetadata({
            target: target as Function,
            sdl: singleSdl,
          });
        }
      });
    });
  };
}

function validateDirective(sdl: string) {
  try {
    parse(`type String ${sdl}`);
  } catch (err) {
    throw new DirectiveParsingError(sdl);
  }
}
