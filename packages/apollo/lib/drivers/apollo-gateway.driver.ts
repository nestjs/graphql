import { Injectable, Logger } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util.js';
import { ModulesContainer } from '@nestjs/core';
import { extend } from '@nestjs/graphql';
import { getVariableValues, GraphQLError, GraphQLSchema } from 'graphql';
import { ApolloGatewayDriverConfig } from '../interfaces/index.js';
import { PluginsExplorerService } from '../services/plugins-explorer.service.js';
import { ApolloBaseDriver } from './apollo-base.driver.js';

/**
 *  @publicApi
 */
@Injectable()
export class ApolloGatewayDriver extends ApolloBaseDriver<ApolloGatewayDriverConfig> {
  private readonly logger = new Logger(ApolloGatewayDriver.name);
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

    const { ApolloGateway } = await loadPackage(
      '@apollo/gateway',
      'ApolloGateway',
      () => import('@apollo/gateway'),
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
    // listener registered through it and only forwards a schema-update
    // event once the user-supplied transform has resolved for that
    // schema. The initial supergraph composed during `load()` is awaited
    // and transformed before `load()` resolves so Apollo Server starts up
    // with the transformed schema. Subsequent updates emitted by the
    // gateway (e.g. supergraph polling) go through the same transform;
    // until it resolves (or if it fails) Apollo Server keeps using the
    // previously transformed schema, so the untransformed schema is
    // never exposed.
    type SchemaContext = {
      apiSchema: GraphQLSchema;
      coreSupergraphSdl: string;
    };

    const queuedListeners = new Set<(ctx: SchemaContext) => void>();
    let latestContext: SchemaContext | undefined;
    let initialEmitted = false;

    const transformAndEmit = async (schemaContext: SchemaContext) => {
      const apiSchema = await transformSchema(schemaContext.apiSchema);
      if (schemaContext !== latestContext) {
        // A newer supergraph arrived while this one was being transformed
        return;
      }
      queuedListeners.forEach((listener) =>
        listener({ ...schemaContext, apiSchema }),
      );
    };

    gateway.onSchemaLoadOrUpdate((schemaContext: SchemaContext) => {
      latestContext = schemaContext;
      if (!initialEmitted) {
        return;
      }
      transformAndEmit(schemaContext).catch((err) =>
        this.logger.error(
          'Failed to transform the updated supergraph schema. The previous schema remains in use.',
          err?.stack,
        ),
      );
    });

    return {
      load: async (loadOptions: any) => {
        const result = await gateway.load(loadOptions);
        // Re-run the transform if the gateway emitted a newer supergraph
        // while the previous one was being transformed
        let transformedContext: SchemaContext | undefined;
        while (transformedContext !== latestContext) {
          transformedContext = latestContext;
          await transformAndEmit(transformedContext!);
        }
        initialEmitted = true;
        return {
          ...result,
          executor: this.checkOperationWithRequestSchema(result.executor),
        };
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

  private checkOperationWithRequestSchema(
    executor: (requestContext: any) => Promise<any>,
  ): (requestContext: any) => Promise<any> {
    // Apollo Server validates every document against the transformed
    // schema (`requestContext.schema`), but the gateway's executor plans
    // and runs the operation against its own, untransformed supergraph.
    // What graphql-js only checks at execution time (the root operation
    // type and the values supplied through variables) is therefore
    // checked here, against the schema the request was validated with,
    // before the gateway takes over.
    return async (requestContext: any) => {
      const { schema, operation, request } = requestContext;
      if (!operation) {
        // Let the gateway report the unresolved operation itself
        return executor(requestContext);
      }
      if (!schema.getRootType(operation.operation)) {
        return {
          data: null,
          errors: [
            new GraphQLError(
              `Schema is not configured to execute ${operation.operation} operation.`,
              { nodes: operation },
            ),
          ],
        };
      }
      const { errors } = getVariableValues(
        schema,
        operation.variableDefinitions ?? [],
        request.variables ?? {},
        { maxErrors: 50 },
      );
      return errors ? { errors } : executor(requestContext);
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
