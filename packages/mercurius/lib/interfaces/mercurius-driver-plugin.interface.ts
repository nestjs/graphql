import {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyPluginOptions,
  FastifyRegisterOptions,
} from 'fastify';

export interface MercuriusDriverPlugin<
  Options extends FastifyPluginOptions = any,
> {
  plugin:
    | FastifyPluginCallback<Options>
    | FastifyPluginAsync<Options>
    | Promise<{
        default: FastifyPluginCallback<Options>;
      }>;
  options?: FastifyRegisterOptions<Options>;
}
