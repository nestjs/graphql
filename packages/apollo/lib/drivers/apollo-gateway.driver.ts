import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util.js';
import { ModulesContainer } from '@nestjs/core';
import { extend } from '@nestjs/graphql';
import { GraphQLSchema } from 'graphql';
import { ApolloGatewayDriverConfig } from '../interfaces/index.js';
import { PluginsExplorerService } from '../services/plugins-explorer.service.js';
import { ApolloBaseDriver } from './apollo-base.driver.js';

/**
 *  @publicApi
 */
@Injectable()
export class ApolloGatewayDriver extends ApolloBaseDriver<ApolloGatewayDriverConfig> {
  private readonly pluginsExplorerService: PluginsExplorerService;

  constructor(modulesContainer: ModulesContainer) {
    super();
    this.pluginsExplorerService = new PluginsExplorerService(modulesContainer);
  }

  public async start(options: ApolloGatewayDriverConfig): Promise<void> {
    options.server ??= {};
    options.server.plugins = extend(
      options.server.plugins || [],
      this.pluginsExplorerService.explore(options),
    );

    const { ApolloGateway } = loadPackage(
      '@apollo/gateway',
      'ApolloGateway',
      () => require('@apollo/gateway'),
    );
    const {
      server: serverOpts = {},
      gateway: gatewayOpts = {},
      transformSchema,
    } = options;
    const gateway = new ApolloGateway(gatewayOpts);

    await super.start({
      ...serverOpts,
      gateway: transformSchema
        ? this.wrapGatewayWithSchemaTransform(gateway, transformSchema)
        : gateway,
    });
  }

  private wrapGatewayWithSchemaTransform(
    gateway: any,
    transformSchema: (
      schema: GraphQLSchema,
    ) => GraphQLSchema | Promise<GraphQLSchema>,
  ): any {
    // Apollo Server consumes the gateway's schema via the synchronous
    // `onSchemaLoadOrUpdate` callback that fires during `gateway.load()`,
    // not via the schema returned from `load()` directly. The callback
    // is registered before `load()` is invoked, which means a naïve
    // wrapper around `load()` cannot intercept the schema in time.
    //
    // To support an async `transformSchema`, this wrapper queues every
    // listener registered through it and only forwards the
    // (synchronous) schema-update events once the user-supplied
    // transform has resolved. The initial supergraph composed during
    // `load()` is awaited and transformed before `load()` resolves so
    // Apollo Server starts up with the transformed schema. Subsequent
    // updates emitted by the gateway (e.g. supergraph polling) cannot
    // be transformed asynchronously without dropping the synchronous
    // contract Apollo Server expects, so they are forwarded
    // untransformed.
    type SchemaContext = {
      apiSchema: GraphQLSchema;
      coreSupergraphSdl: string;
    };

    const queuedListeners = new Set<(ctx: SchemaContext) => void>();
    let initialContext: SchemaContext | undefined;
    let initialEmitted = false;

    gateway.onSchemaLoadOrUpdate((schemaContext: SchemaContext) => {
      if (!initialEmitted) {
        initialContext = schemaContext;
        return;
      }
      queuedListeners.forEach((listener) => listener(schemaContext));
    });

    return {
      load: async (loadOptions: any) => {
        const result = await gateway.load(loadOptions);
        if (initialContext) {
          const transformedSchema = await transformSchema(
            initialContext.apiSchema,
          );
          const transformedContext: SchemaContext = {
            ...initialContext,
            apiSchema: transformedSchema,
          };
          queuedListeners.forEach((listener) => listener(transformedContext));
        }
        initialEmitted = true;
        return result;
      },
      onSchemaLoadOrUpdate: (callback: (ctx: SchemaContext) => void) => {
        queuedListeners.add(callback);
        return () => {
          queuedListeners.delete(callback);
        };
      },
      stop: () => gateway.stop(),
    };
  }

  public async mergeDefaultOptions(
    options: Record<string, any>,
  ): Promise<Record<string, any>> {
    return {
      ...options,
      server: await super.mergeDefaultOptions(options?.server ?? {}),
    };
  }

  public generateSchema(_: ApolloGatewayDriverConfig) {
    return null;
  }
}
