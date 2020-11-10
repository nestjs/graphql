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
    moduleOptions.context = ({ req, request }) => ({ req: req ?? request });
  } else if (isFunction(moduleOptions.context)) {
    moduleOptions.context = async (...args: unknown[]) => {
      const ctx = await (options.context as Function)(...args);
      const { req, request } = args[0] as Record<string, unknown>;
      return assignReqProperty(ctx, req ?? request);
    };
  } else {
    moduleOptions.context = ({ req, request }: Record<string, unknown>) => {
      return assignReqProperty(
        options.context as Record<string, any>,
        req ?? request,
      );
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
