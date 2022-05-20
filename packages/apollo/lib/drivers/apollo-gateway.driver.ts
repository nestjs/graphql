import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { ModulesContainer } from '@nestjs/core';
import { extend } from '@nestjs/graphql';
import { ApolloGatewayDriverConfig } from '../interfaces';
import { PluginsExplorerService } from '../services/plugins-explorer.service';
import { ApolloBaseDriver } from './apollo-base.driver';

@Injectable()
export class ApolloGatewayDriver extends ApolloBaseDriver<ApolloGatewayDriverConfig> {
  private readonly pluginsExplorerService: PluginsExplorerService;

  constructor(modulesContainer: ModulesContainer) {
    super();
    this.pluginsExplorerService = new PluginsExplorerService(modulesContainer);
  }

  public async start(options: ApolloGatewayDriverConfig): Promise<void> {
    options.server.plugins = extend(
      options.server.plugins || [],
      this.pluginsExplorerService.explore(options),
    );

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
