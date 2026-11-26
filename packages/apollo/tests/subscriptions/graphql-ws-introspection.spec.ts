import { INestApplication, Module } from '@nestjs/common';
import {
  GraphQLModule,
  GraphQLSchemaHost,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { GraphQLError, parse, ValidationContext } from 'graphql';
import { Client, createClient } from 'graphql-ws';
import request from 'supertest';
import ws from 'ws';
import {
  ApolloDriver,
  ApolloDriverConfig,
  ApolloFederationDriver,
} from '../../lib/index.js';

@Resolver()
class AppResolver {
  @Query(() => String)
  hello(): string {
    return 'world';
  }

  @Query(() => String)
  secret(): string {
    return 'top secret';
  }
}

// Refuses every operation that selects the "secret" field
const NoSecretRule = (context: ValidationContext) => ({
  Field(node: { name: { value: string } }) {
    if (node.name.value === 'secret') {
      context.reportError(new GraphQLError('"secret" is not allowed'));
    }
  },
});

const INTROSPECTION_QUERY = '{ __schema { queryType { name } } }';
const TYPE_QUERY = '{ __type(name: "Query") { name } }';

describe.each([
  ['ApolloDriver', ApolloDriver],
  ['ApolloFederationDriver', ApolloFederationDriver],
])('graphql-ws introspection (%s)', (_, driver) => {
  let app: INestApplication | undefined;
  let wsClient: Client | undefined;

  const closeApp = async () => {
    await wsClient?.dispose();
    await app?.close();
    wsClient = undefined;
    app = undefined;
  };

  afterEach(async () => {
    await closeApp();
    vi.unstubAllEnvs();
  });

  const createApp = async (options: Partial<ApolloDriverConfig> = {}) => {
    @Module({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver,
          autoSchemaFile: true,
          subscriptions: { 'graphql-ws': true },
          ...options,
        }),
      ],
      providers: [AppResolver],
    })
    class AppModule {}

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    wsClient = createClient({
      url: `ws://127.0.0.1:${app.getHttpServer().address().port}/graphql`,
      webSocketImpl: ws,
      retryAttempts: 0,
    });
  };

  const overHttp = async (query: string) =>
    (await request(app!.getHttpServer()).post('/graphql').send({ query })).body;

  const overWebSocket = (query: string) =>
    new Promise<any>((resolve) => {
      let result: any;
      wsClient!.subscribe(
        { query },
        {
          next: (value) => (result = value),
          // graphql-ws reports errors raised before execution this way
          error: (errors) => resolve({ errors }),
          complete: () => resolve(result),
        },
      );
    });

  const expectRefused = (result: any) => {
    expect(result.data).toBeUndefined();
    expect(result.errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('introspection is not allowed'),
        extensions: expect.objectContaining({
          code: 'GRAPHQL_VALIDATION_FAILED',
          validationErrorCode: 'INTROSPECTION_DISABLED',
        }),
      }),
    ]);
  };

  it('should refuse introspection with NODE_ENV=production, as over HTTP', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await createApp();

    const httpResult = await overHttp(INTROSPECTION_QUERY);
    expectRefused(httpResult);

    const wsResult = await overWebSocket(INTROSPECTION_QUERY);
    expectRefused(wsResult);
    // The client reads the same error over both transports
    expect(wsResult.errors[0].message).toBe(httpResult.errors[0].message);
    expect(wsResult.errors[0].extensions).toEqual(
      httpResult.errors[0].extensions,
    );

    expectRefused(await overWebSocket(TYPE_QUERY));
    expect(await overWebSocket('{ hello __typename }')).toEqual({
      data: { hello: 'world', __typename: 'Query' },
    });
  });

  it('should follow the "introspection" option', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await createApp({ introspection: true });
    expect(await overWebSocket(INTROSPECTION_QUERY)).toEqual({
      data: { __schema: { queryType: { name: 'Query' } } },
    });

    vi.stubEnv('NODE_ENV', 'development');
    await closeApp();
    await createApp({ introspection: false });
    expectRefused(await overHttp(INTROSPECTION_QUERY));
    expectRefused(await overWebSocket(INTROSPECTION_QUERY));
  });

  it('should refuse introspection when "nodeEnv" is "production"', async () => {
    await createApp({ nodeEnv: 'production' });

    expectRefused(await overHttp(INTROSPECTION_QUERY));
    expectRefused(await overWebSocket(INTROSPECTION_QUERY));
  });

  it('should keep applying "validationRules" alongside', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await createApp({ validationRules: [NoSecretRule] });

    expectRefused(await overWebSocket(INTROSPECTION_QUERY));
    expect((await overWebSocket('{ secret }')).errors).toEqual([
      expect.objectContaining({ message: '"secret" is not allowed' }),
    ]);
  });

  it('should refuse introspection after an "onSubscribe" that returns nothing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const onSubscribe = vi.fn();
    await createApp({ subscriptions: { 'graphql-ws': { onSubscribe } } });

    expectRefused(await overWebSocket(INTROSPECTION_QUERY));
    expect(onSubscribe).toHaveBeenCalledTimes(1);
  });

  it('should refuse introspection in the execution arguments an "onSubscribe" builds', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    // graphql-ws skips "validate" for the arguments such a hook returns
    await createApp({
      subscriptions: {
        'graphql-ws': {
          onSubscribe: (_ctx, _id, payload) => ({
            schema: app!.get(GraphQLSchemaHost).schema,
            document: parse(payload.query),
          }),
        },
      },
    });

    expectRefused(await overWebSocket(INTROSPECTION_QUERY));
    expect(await overWebSocket('{ hello }')).toEqual({
      data: { hello: 'world' },
    });
  });

  it('should refuse introspection after a custom "validate"', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const validate = vi.fn(() => []);
    await createApp({ subscriptions: { 'graphql-ws': { validate } } });

    expectRefused(await overWebSocket(INTROSPECTION_QUERY));
    expect(validate).toHaveBeenCalledTimes(1);
    expect(await overWebSocket('{ hello }')).toEqual({
      data: { hello: 'world' },
    });
  });
});
