import { SetMetadata } from '@nestjs/common';
import { PLUGIN_METADATA } from '../apollo.constants';

/**
 * Decorator that marks a class as an Apollo plugin.
 */
export function Plugin(): ClassDecorator {
  return (target: Function) => {
    SetMetadata(PLUGIN_METADATA, true)(target);
  };
}
