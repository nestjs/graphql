import { INestApplication, Module } from '@nestjs/common';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { GraphQLError, ValidationContext } from 'graphql';
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

  @Query(() => String)
  failing(): string {
    throw new Error('connection to db-internal.local:5432 refused');
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

describe.each([
  ['ApolloDriver', ApolloDriver],
  ['ApolloFederationDriver', ApolloFederationDriver],
])('graphql-ws server options (%s)', (_, driver) => {
  let app: INestApplication;
  let wsClient: Client;
  let onSubscribe: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    onSubscribe = vi.fn();

    @Module({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver,
          autoSchemaFile: true,
          includeStacktraceInErrorResponses: false,
          validationRules: [NoSecretRule],
          formatError: (formattedError) =>
            formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR'
              ? { message: 'Internal server error' }
              : formattedError,
          subscriptions: { 'graphql-ws': { onSubscribe } },
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
  });

  afterEach(async () => {
    await wsClient?.dispose();
    await app.close();
  });

  const overHttp = async (query: string) =>
    (await request(app.getHttpServer()).post('/graphql').send({ query })).body;

  const overWebSocket = (query: string) =>
    new Promise<any>((resolve) => {
      let result: any;
      wsClient.subscribe(
        { query },
        {
          next: (value) => (result = value),
          // graphql-ws reports errors raised before execution this way
          error: (errors) => resolve({ errors }),
          complete: () => resolve(result),
        },
      );
    });

  it('should execute valid operations', async () => {
    expect(await overWebSocket('{ hello }')).toEqual({
      data: { hello: 'world' },
    });
    expect(onSubscribe).toHaveBeenCalledTimes(1);
  });

  it('should apply "validationRules" as over HTTP', async () => {
    const httpResult = await overHttp('{ secret }');
    expect(httpResult.errors[0].message).toBe('"secret" is not allowed');

    const wsResult = await overWebSocket('{ secret }');
    expect(wsResult.data).toBeUndefined();
    expect(wsResult.errors).toEqual([
      expect.objectContaining({ message: '"secret" is not allowed' }),
    ]);
  });

  it('should apply "formatError" as over HTTP', async () => {
    const httpResult = await overHttp('{ failing }');
    expect(httpResult.errors).toEqual([{ message: 'Internal server error' }]);

    expect(await overWebSocket('{ failing }')).toEqual({
      data: null,
      errors: [{ message: 'Internal server error' }],
    });
  });
});
