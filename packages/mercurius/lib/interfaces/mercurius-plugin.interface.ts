import {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyPluginOptions,
  FastifyRegisterOptions,
} from 'fastify';

/**
 * @publicApi
 */
export interface MercuriusPlugin<
  Options extends FastifyPluginOptions = unknown,
> {
  plugin:
    | FastifyPluginCallback<Options>
    | FastifyPluginAsync<Options>
    | Promise<{
        default: FastifyPluginCallback<Options>;
      }>;
  options?: FastifyRegisterOptions<Options>;
}

/**
 * @publicApi
 */
export interface MercuriusPlugins<
  Options extends FastifyPluginOptions = unknown,
> {
  plugins?: MercuriusPlugin<Options>[];
}
