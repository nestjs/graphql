import { ModulesContainer } from '@nestjs/core';
import { buildSchema, GraphQLError, parse } from 'graphql';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';

const schema = buildSchema('type Query { hello: String }');
const introspection = parse('{ __schema { queryType { name } } }');
const typeLookup = parse('{ __type(name: "Query") { name } }');
const hello = parse('{ hello __typename }');

describe('ApolloDriver graphql-ws subscription config', () => {
  const driver = new ApolloDriver(new ModulesContainer());

  const getConfig = (options: Partial<ApolloDriverConfig>) =>
    (driver as any).getSubscriptionConfig(options)['graphql-ws'];

  const validationCodes = (errors: readonly GraphQLError[]) =>
    errors.map((error) => error.extensions.validationErrorCode);

  afterEach(() => vi.unstubAllEnvs());

  it('should refuse introspection when NODE_ENV is production and "introspection" is not set', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { validate } = getConfig({ subscriptions: { 'graphql-ws': true } });

    expect(validationCodes(validate(schema, introspection))).toEqual([
      'INTROSPECTION_DISABLED',
    ]);
    expect(validationCodes(validate(schema, typeLookup))).toEqual([
      'INTROSPECTION_DISABLED',
    ]);
    // Only introspection is refused, and the specified rules still apply
    expect(validate(schema, hello)).toEqual([]);
    expect(validate(schema, parse('{ missing }'))).toHaveLength(1);
  });

  it('should resolve "introspection" as Apollo Server does', () => {
    const refuses = (options: Partial<ApolloDriverConfig>) => {
      const { validate } = getConfig({
        subscriptions: { 'graphql-ws': {} },
        ...options,
      });
      return !!validate && validate(schema, introspection).length > 0;
    };

    expect(refuses({ introspection: false })).toBe(true);
    expect(refuses({ nodeEnv: 'production' })).toBe(true);
    expect(refuses({})).toBe(false);

    vi.stubEnv('NODE_ENV', 'production');
    expect(refuses({})).toBe(true);
    expect(refuses({ introspection: true })).toBe(false);
    // "nodeEnv" takes precedence over NODE_ENV
    expect(refuses({ nodeEnv: 'development' })).toBe(false);
  });

  it('should refuse introspection after a custom "validate", and keep its errors', () => {
    const customError = new GraphQLError('custom');
    const customValidate = vi.fn((_schema, document) =>
      document === hello ? [customError] : [],
    );
    const { validate } = getConfig({
      introspection: false,
      subscriptions: { 'graphql-ws': { validate: customValidate } },
    });

    expect(validationCodes(validate(schema, introspection))).toEqual([
      'INTROSPECTION_DISABLED',
    ]);
    expect(validate(schema, hello)).toEqual([customError]);
    expect(customValidate).toHaveBeenCalledTimes(2);
  });

  it('should validate the execution arguments built by a custom "onSubscribe"', async () => {
    const { onSubscribe } = getConfig({
      introspection: false,
      subscriptions: {
        'graphql-ws': {
          onSubscribe: (_ctx, _id, payload) => ({
            schema,
            document: parse(payload.query),
          }),
        },
      },
    });

    const refused = await onSubscribe({}, '1', {
      query: '{ __schema { queryType { name } } }',
    });
    expect(validationCodes(refused)).toEqual(['INTROSPECTION_DISABLED']);

    const allowed = await onSubscribe({}, '2', { query: '{ hello }' });
    expect(allowed).toEqual(expect.objectContaining({ schema }));
  });
});
