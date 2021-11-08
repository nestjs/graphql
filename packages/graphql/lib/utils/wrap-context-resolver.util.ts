import { isFunction } from '@nestjs/common/utils/shared.utils';
import { GqlModuleOptions } from '../interfaces/gql-module-options.interface';

export function wrapContextResolver(
  targetOptions: GqlModuleOptions,
  originalOptions: GqlModuleOptions,
) {
  if (!targetOptions.context) {
    targetOptions.context = ({ req, request }) => ({ req: req ?? request });
  } else if (isFunction(targetOptions.context)) {
    targetOptions.context = async (...args: unknown[]) => {
      const ctx = await (originalOptions.context as Function)(...args);
      const { req, request } = args[0] as Record<string, unknown>;
      return assignReqProperty(ctx, req ?? request);
    };
  } else {
    targetOptions.context = ({ req, request }: Record<string, unknown>) => {
      return assignReqProperty(
        originalOptions.context as Record<string, any>,
        req ?? request,
      );
    };
  }
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
