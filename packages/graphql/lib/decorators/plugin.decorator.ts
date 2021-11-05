import { SetMetadata } from '@nestjs/common';
import { PLUGIN_METADATA } from '../graphql.constants';

/**
 * Decorator that marks a class as a Apollo plugin.
 */
export function Plugin(): ClassDecorator {
  return (target: Function) => {
    SetMetadata(PLUGIN_METADATA, true)(target);
  };
}
