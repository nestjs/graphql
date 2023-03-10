import { FastifyInstance } from 'fastify';
import { MercuriusHooksObject } from '../interfaces/mercurius-hook.interface';
import { isArray, isNull, isUndefined } from './validation.util';

export function registerMercuriusHooks(
  app: FastifyInstance,
  hooks?: MercuriusHooksObject | null,
  key: 'graphql' | 'graphqlGateway' = 'graphql',
): void {
  if (isUndefined(hooks) || isNull(hooks)) {
    return;
  }

  Object.entries(hooks).forEach(([hookName, hookFn]: [any, any]) => {
    if (isUndefined(hookFn) || isNull(hookFn)) {
      return;
    }

    if (isArray<any>(hookFn)) {
      hookFn.forEach((fn) => (app[key] as any).addHook(hookName, fn));
      return;
    }

    (app[key] as any).addHook(hookName, hookFn);
  });
}
