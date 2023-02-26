import { FastifyInstance } from 'fastify';
import { PluginOptions } from './interfaces/plugin-options.interface';
import { BASE_PLUGIN_URL } from './utils/constants';
import { pluginResponse } from './utils/plugin-response';

export async function mockPlugin(
  fastify: FastifyInstance,
  options?: PluginOptions,
) {
  const url = options?.url ?? BASE_PLUGIN_URL;

  fastify.get(url, async (request, reply) => {
    return pluginResponse(url);
  });
}
