import { FastifyInstance } from 'fastify';
import { MercuriusGatewayHook } from '../interfaces';

export function registerMercuriusHooks(
  app: FastifyInstance,
  hooks?: MercuriusGatewayHook[] | null,
): void {
  if (hooks === undefined || hooks === null || hooks.length === 0) {
    return;
  }

  // Needs any since can't do type inference on the hooks array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hooks.forEach((hook: Record<string, any>) => {
    app.graphql.addHook(hook.name, hook.hook);
  });
}
