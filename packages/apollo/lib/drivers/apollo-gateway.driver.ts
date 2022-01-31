import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { ApolloGatewayDriverConfig } from '../interfaces';
import { ApolloBaseDriver } from './apollo-base.driver';

@Injectable()
export class ApolloGatewayDriver extends ApolloBaseDriver<ApolloGatewayDriverConfig> {
  public async start(options: ApolloGatewayDriverConfig): Promise<void> {
    const { ApolloGateway } = loadPackage(
      '@apollo/gateway',
      'ApolloGateway',
      () => require('@apollo/gateway'),
    );
    const { server: serverOpts = {}, gateway: gatewayOpts = {} } = options;
    const gateway = new ApolloGateway(gatewayOpts);

    await super.start({
      ...serverOpts,
      gateway,
    });
  }

  public async mergeDefaultOptions(
    options: Record<string, any>,
  ): Promise<Record<string, any>> {
    return {
      ...options,
      server: await super.mergeDefaultOptions(options?.server ?? {}),
    };
  }
}
