import { FastifyInstance } from 'fastify';
import { MercuriusPlugin } from '../interfaces/mercurius-plugin.interface.js';
import { isArray, isNull, isUndefined } from './validation.util.js';

export async function registerMercuriusPlugin(
  app: FastifyInstance,
  plugins?: MercuriusPlugin[],
): Promise<void> {
  if (
    isUndefined(plugins) ||
    isNull(plugins) ||
    !isArray(plugins) ||
    plugins.length === 0
  ) {
    return;
  }

  for (const plugin of plugins) {
    await app.register(plugin.plugin as any, plugin.options ?? {});
  }
}
