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
    moduleOptions.context = async (...args: unknown[]) => {
      const ctx = await (options.context as Function)(...args);
      const { req } = args[0] as Record<string, unknown>;
      if (ctx && typeof ctx === 'object') {
        ctx.req = req;
      }
      return ctx;
    };
  } else {
    moduleOptions.context = ({ req }: Record<string, unknown>) => {
      if (options.context && typeof options.context === 'object') {
        (options.context as Record<string, unknown>).req = req;
      }
      return options.context;
    };
  }
  return moduleOptions;
}
