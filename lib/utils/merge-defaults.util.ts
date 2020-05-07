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
      return assignReqProperty(ctx, req);
    };
  } else {
    moduleOptions.context = ({ req }: Record<string, unknown>) => {
      return assignReqProperty(options.context as Record<string, any>, req);
    };
  }
  return moduleOptions;
}

function assignReqProperty(
  ctx: Record<string, unknown> | undefined,
  req: unknown,
) {
  if (!ctx) {
    return { req };
  }
  if (
    typeof ctx !== 'object' ||
    (ctx && ctx.req && typeof ctx.req === 'object')
  ) {
    return ctx;
  }
  ctx.req = req;
  return ctx;
}
