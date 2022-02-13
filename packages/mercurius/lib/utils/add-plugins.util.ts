import { FastifyInstance } from 'fastify';
import { MercuriusDriverPlugin } from '../interfaces/mercurius-driver-plugin.interface';

export async function addPlugins(
  app: FastifyInstance,
  plugins?: MercuriusDriverPlugin[],
): Promise<void> {
  if (plugins && plugins.length > 0) {
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      await app.register(plugin.plugin, plugin.options);
    }
  }
}
