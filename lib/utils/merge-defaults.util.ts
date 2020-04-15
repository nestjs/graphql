import { isFunction } from '@nestjs/common/utils/shared.utils';
import { GqlModuleOptions } from '../interfaces/gql-module-options.interface';

const defaultOptions: GqlModuleOptions = {
  path: '/graphql',
  fieldResolverEnhancers: [],
};

export function mergeDefaults(
  options: GqlModuleOptions,
  defaults: GqlModuleOptions = defaultOptions,
): GqlModuleOptions {
  const moduleOptions = {
    ...defaults,
    ...options,
  };
  if (!moduleOptions.context) {
    moduleOptions.context = ({ req }) => ({ req });
  } else if (isFunction(moduleOptions.context)) {
    moduleOptions.context = (...args: unknown[]) => {
      const ctx = (options.context as Function)(...args);
      const { req } = args[0] as Record<string, unknown>;
      if (typeof ctx === 'object') {
        return {
          req,
          ...ctx,
        };
      }
      return ctx;
    };
  } else {
    moduleOptions.context = ({ req }: Record<string, unknown>) => {
      if (typeof options.context === 'object') {
        return {
          req,
          ...options.context,
        };
      }
      return options.context;
    };
  }
  return moduleOptions;
}
