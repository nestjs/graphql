import { AbstractGraphQLDriver } from '@nestjs/graphql';
import { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import mercurius from 'mercurius';
import { MercuriusDriverConfig } from '../interfaces/mercurius-driver-config.interface';
import { registerMercuriusHooks } from '../utils/register-mercurius-hooks.util';
import { registerMercuriusPlugin } from '../utils/register-mercurius-plugin.util';

export class MercuriusGatewayDriver extends AbstractGraphQLDriver<MercuriusDriverConfig> {
  get instance(): FastifyInstance<
    Server,
    IncomingMessage,
    ServerResponse,
    FastifyBaseLogger
  > {
    return this.httpAdapterHost?.httpAdapter?.getInstance?.();
  }

  public async start(options: MercuriusDriverConfig) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName !== 'fastify') {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }

    const { plugins, hooks, ...mercuriusOptions } = options;
    const app = httpAdapter.getInstance<FastifyInstance>();
    await app.register(mercurius, {
      ...mercuriusOptions,
    });
    await registerMercuriusPlugin(app, plugins);
    await registerMercuriusHooks(app, hooks);
  }

  public async stop(): Promise<void> {}
}
