import { FastifyInstance } from 'fastify';
import { BASE_URL, PLUGIN_RESPONSE } from './contants';
import { MockPluginOptions } from './interfaces/mock-plugin-options.interface';

export default async function mockPlugin(
  fastify: FastifyInstance,
  options?: MockPluginOptions,
) {
  fastify.get(options?.url ?? BASE_URL, async (request, reply) => {
    return PLUGIN_RESPONSE;
  });
}
