import { MercuriusDriverPlugin } from '../../../../lib/interfaces/mercurius-driver-plugin.interface';
import altairFastify, {
  AltairFastifyPluginOptions,
} from 'altair-fastify-plugin';

export const altairPlugin: MercuriusDriverPlugin<AltairFastifyPluginOptions> = {
  plugin: altairFastify,
  options: {
    path: '/altair',
    baseURL: '/altair/',
    endpointURL: '/graphql',
  },
};
