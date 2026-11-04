import { HIDE_FIELD_METADATA } from '../graphql.constants.js';

/**
 * Excludes the property from the schema generated with the CLI plugin.
 *
 * The plugin skips members decorated with `@HideField()` when it can tell
 * from the source. The decorator also marks the member at runtime, so that it
 * stays hidden when it is applied through `applyDecorators()` or another
 * composed decorator the plugin cannot see through.
 *
 * @publicApi
 */
export function HideField(): PropertyDecorator {
  return (target: Record<string, any>, propertyKey: string | symbol) => {
    Reflect.defineMetadata(HIDE_FIELD_METADATA, true, target, propertyKey);
  };
}
