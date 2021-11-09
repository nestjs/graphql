import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { ApolloGatewayAdapterOptions } from '..';
import { ApolloGraphQLBaseAdapter } from './apollo-graphql-base.adapter';

@Injectable()
export class ApolloGatewayGraphQLAdapter extends ApolloGraphQLBaseAdapter<ApolloGatewayAdapterOptions> {
  public async start(options: ApolloGatewayAdapterOptions): Promise<void> {
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
}
