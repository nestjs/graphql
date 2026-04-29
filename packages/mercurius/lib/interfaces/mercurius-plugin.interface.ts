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
  Options extends FastifyPluginOptions = FastifyPluginOptions,
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
  Options extends FastifyPluginOptions = FastifyPluginOptions,
> {
  plugins?: MercuriusPlugin<Options>[];
}
