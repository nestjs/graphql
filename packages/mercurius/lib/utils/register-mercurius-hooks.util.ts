import { FastifyInstance } from 'fastify';
import { MercuriusGatewayHooksObject } from '../interfaces/mercurius-hook.interface';
import { isArray, isNull, isUndefined } from './validation.util';

export function registerMercuriusHooks(
  app: FastifyInstance,
  hooks?: MercuriusGatewayHooksObject | null,
): void {
  if (isUndefined(hooks) || isNull(hooks)) {
    return;
  }

  Object.entries(hooks).forEach(([hookName, hookFn]: [any, any]) => {
    if (isUndefined(hookFn) || isNull(hookFn)) {
      return;
    }

    if (isArray<any>(hookFn)) {
      hookFn.forEach((fn) => app.graphql.addHook(hookName, fn));
      return;
    }

    app.graphql.addHook(hookName, hookFn);
  });
}
