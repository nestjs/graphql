import { FastifyInstance } from 'fastify';
import {
  GraphQLFieldResolver,
  GraphQLSchema,
  isObjectType,
  Kind,
  OperationTypeNode,
  printSchema,
} from 'graphql';
import mercurius from 'mercurius';
import { MercuriusDriverConfig } from '../interfaces/mercurius-driver-config.interface.js';
import { registerMercuriusHooks } from '../utils/register-mercurius-hooks.util.js';
import { registerMercuriusRequestHooks } from '../utils/register-mercurius-request-hooks.util.js';
import { registerMercuriusPlugin } from '../utils/register-mercurius-plugin.util.js';
import { MercuriusBaseDriver } from './mercurius-base.driver.js';

/**
 * @publicApi
 */
export class MercuriusDriver extends MercuriusBaseDriver<MercuriusDriverConfig> {
  /**
   * Whether the "resolvers" option is compiled into the generated schema.
   */
  private resolversInSchema = false;
  /**
   * For each field resolved by a loader ("Type.field"), its resolver in the
   * generated schema (a stand-in, wrapped by "transformSchema").
   */
  private readonly loaderFieldResolvers = new Map<
    string,
    GraphQLFieldResolver<unknown, unknown> | undefined
  >();
  /**
   * For each field resolved by a loader, the resolver Mercurius created.
   */
  private readonly loaderResolvers = new Map<
    string,
    GraphQLFieldResolver<unknown, unknown>
  >();

  public generateSchema(
    options: MercuriusDriverConfig,
  ): Promise<GraphQLSchema> | null {
    return super.generateSchema(this.prepareSchemaOptions(options));
  }

  public async start(mercuriusOptions: MercuriusDriverConfig) {
    const { plugins, hooks, ...options } = mercuriusOptions;

    if (options.definitions && options.definitions.path) {
      await this.graphQlFactory.generateDefinitions(
        printSchema(options.schema as GraphQLSchema),
        options,
      );
    }

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName !== 'fastify') {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }
    const app = httpAdapter.getInstance<FastifyInstance>();
    await app.register(mercurius, {
      ...options,
      // Mercurius assigns "resolvers" onto the schema it is given. Once they
      // are compiled into the generated schema, that would replace the
      // resolvers "transformSchema" wrapped (a ready-made "schema" still
      // gets them from Mercurius).
      resolvers: this.resolversInSchema ? undefined : options.resolvers,
    });
    this.connectLoaderResolvers(app);
    this.rejectSubscriptionOperations(app);
    await registerMercuriusPlugin(app, plugins);
    registerMercuriusHooks(app, hooks);
    registerMercuriusRequestHooks(app, this.resolverDecoratorHost);
  }

  /**
   * Applied to the options the schema is generated with.
   */
  protected prepareSchemaOptions(
    options: MercuriusDriverConfig,
  ): MercuriusDriverConfig {
    // Mirrors the branches of the schema factories
    this.resolversInSchema =
      !!options.autoSchemaFile || !!options.typeDefs?.length;

    const { loaders, transformSchema } = options;
    if (!loaders) {
      return options;
    }
    return {
      ...options,
      // Mercurius assigns the resolvers it creates for "loaders" onto the
      // finished schema, over the wrappers "transformSchema" adds. Stand-ins
      // take their place before the transform, so that it wraps them, and
      // are connected to the loaders once Mercurius has created them.
      transformSchema: async (schema: GraphQLSchema) => {
        this.installLoaderStandIns(schema, loaders);
        const transformedSchema = transformSchema
          ? await transformSchema(schema)
          : schema;
        for (const key of this.loaderFieldResolvers.keys()) {
          this.loaderFieldResolvers.set(
            key,
            this.getField(transformedSchema, key)?.resolve,
          );
        }
        return transformedSchema;
      },
    };
  }

  private installLoaderStandIns(
    schema: GraphQLSchema,
    loaders: NonNullable<MercuriusDriverConfig['loaders']>,
  ) {
    for (const [typeName, fields] of Object.entries(loaders)) {
      for (const fieldName of Object.keys(fields)) {
        const key = `${typeName}.${fieldName}`;
        const field = this.getField(schema, key);
        if (!field) {
          // Mercurius reports the unknown field itself
          continue;
        }
        field.resolve = (...args) => {
          const resolve = this.loaderResolvers.get(key);
          if (!resolve) {
            throw new Error(`The loader of "${key}" is not registered.`);
          }
          return resolve(...args);
        };
        this.loaderFieldResolvers.set(key, field.resolve);
      }
    }
  }

  private connectLoaderResolvers(app: FastifyInstance) {
    for (const [key, resolve] of this.loaderFieldResolvers) {
      const field = this.getField(app.graphql.schema, key);
      if (!field?.resolve || !resolve) {
        // Leave the loader in place (e.g. a transform that dropped the
        // resolver of the field)
        continue;
      }
      this.loaderResolvers.set(key, field.resolve);
      field.resolve = resolve;
    }
  }

  private getField(schema: GraphQLSchema, key: string) {
    const [typeName, fieldName] = key.split('.');
    const type = schema.getType(typeName);
    return isObjectType(type) ? type.getFields()[fieldName] : undefined;
  }

  private rejectSubscriptionOperations(app: FastifyInstance) {
    // Subscriptions received over WebSocket never get here: Mercurius runs
    // them apart from the operations it executes (over HTTP, or "app.graphql()"
    // calls). Those it hands to graphql-js "execute()", which runs a
    // subscription like a query: it calls the "resolve" function of the root
    // field, never "subscribe", where Nest runs the guards, interceptors and
    // filters of the handler. The hook gets no operation name, so a document
    // with any subscription operation in it is refused.
    app.graphql.addHook('preExecution', async (_schema, document) => {
      const hasSubscription = document.definitions.some(
        (definition) =>
          definition.kind === Kind.OPERATION_DEFINITION &&
          definition.operation === OperationTypeNode.SUBSCRIPTION,
      );
      if (hasSubscription) {
        throw new mercurius.ErrorWithProps(
          'Subscription operations are not supported over HTTP. Use a WebSocket connection instead.',
          { code: 'BAD_REQUEST' },
          400,
        );
      }
    });
  }
}
