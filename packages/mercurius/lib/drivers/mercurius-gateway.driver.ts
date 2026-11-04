import { loadPackage } from '@nestjs/common/utils/load-package.util.js';
import { FastifyInstance } from 'fastify';
import { MercuriusGatewayDriverConfig } from '../interfaces/index.js';
import { registerMercuriusHooks } from '../utils/register-mercurius-hooks.util.js';
import { registerMercuriusRequestHooks } from '../utils/register-mercurius-request-hooks.util.js';
import { registerMercuriusPlugin } from '../utils/register-mercurius-plugin.util.js';
import { MercuriusBaseDriver } from './mercurius-base.driver.js';

/**
 * @publicApi
 */
export class MercuriusGatewayDriver extends MercuriusBaseDriver<MercuriusGatewayDriverConfig> {
  public async mergeDefaultOptions(
    options: MercuriusGatewayDriverConfig,
  ): Promise<MercuriusGatewayDriverConfig> {
    if (options.transformSchema) {
      // The gateway composes its schema from the services at runtime (and
      // again on every refresh), so there is no generated schema to apply the
      // transform to. Refuse it rather than serve the untransformed schema.
      throw new Error(
        'The "transformSchema" option is not supported by the MercuriusGatewayDriver. Apply the transformation in the subgraphs instead.',
      );
    }
    return super.mergeDefaultOptions(options);
  }

  public async start(options: MercuriusGatewayDriverConfig) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName !== 'fastify') {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }

    const {
      plugins,
      hooks,
      schema: _, // Schema stubbed to be compatible with other drivers, ignore.
      ...mercuriusOptions
    } = options;
    const app = httpAdapter.getInstance<FastifyInstance>();
    const mercuriusGateway = await loadPackage(
      '@mercuriusjs/gateway',
      'MercuriusGatewayDriver',
      () => import('@mercuriusjs/gateway'),
    );
    await app.register(mercuriusGateway.default ?? mercuriusGateway, {
      ...mercuriusOptions,
    });
    await registerMercuriusPlugin(app, plugins);
    registerMercuriusHooks(app, hooks, 'graphqlGateway');
    registerMercuriusRequestHooks(app, this.resolverDecoratorHost);
  }

  public generateSchema(options: MercuriusGatewayDriverConfig) {
    return null;
  }
}
