import { isString } from '@nestjs/common/utils/shared.utils.js';

export interface PluginOptions {
  typeFileNameSuffix?: string | string[];
  introspectComments?: boolean;
  readonly?: boolean;
  pathToSource?: string;
  debug?: boolean;
  /**
   * Whether the plugin should emit ESM-compatible code (no `require` calls,
   * output extensions appended to relative specifiers).
   * When not set explicitly, it is inferred from the module format of each file.
   */
  esmCompatible?: boolean;
  /**
   * @internal Set when "esmCompatible" was either configured by the user
   * or already resolved for a given source file.
   */
  esmCompatibleWasConfigured?: boolean;
}

const defaultOptions: PluginOptions = {
  typeFileNameSuffix: ['.input.ts', '.args.ts', '.entity.ts', '.model.ts'],
  introspectComments: false,
  readonly: false,
  debug: false,
  esmCompatible: false,
};

export const mergePluginOptions = (
  options: Record<string, any> = {},
): PluginOptions => {
  if (isString(options.typeFileNameSuffix)) {
    options.typeFileNameSuffix = [options.typeFileNameSuffix];
  }
  const esmCompatibleWasConfigured =
    options.esmCompatibleWasConfigured ??
    Object.prototype.hasOwnProperty.call(options, 'esmCompatible');

  return {
    ...defaultOptions,
    ...options,
    esmCompatibleWasConfigured,
  };
};
