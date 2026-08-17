import { ApplicationConfig, HttpAdapterHost } from '@nestjs/core';
import { GraphQLFactory, ResolverDecoratorHost } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { ApolloDriver } from '../../lib/drivers/index.js';
import { GraphiQLPlaygroundPlugin } from '../../lib/graphiql/graphiql-playground.plugin.js';
import { ApolloDriverConfig } from '../../lib/interfaces/index.js';

/**
 * `graphiql` takes precedence over the deprecated `playground` alias, and only
 * when neither is set does the environment decide. Every combination has to
 * resolve to exactly one landing page plugin - never none, which would let
 * Apollo fall back to its own landing page.
 */
describe('GraphiQL landing page resolution', () => {
  let driver: ApolloDriver;
  let initialNodeEnv: string | undefined;

  beforeEach(async () => {
    initialNodeEnv = process.env.NODE_ENV;

    const moduleRef = await Test.createTestingModule({
      providers: [
        ApolloDriver,
        ResolverDecoratorHost,
        { provide: ApplicationConfig, useValue: new ApplicationConfig() },
        { provide: HttpAdapterHost, useValue: {} },
        { provide: GraphQLFactory, useValue: {} },
      ],
    }).compile();

    driver = moduleRef.get(ApolloDriver);
  });

  afterEach(() => {
    if (initialNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = initialNodeEnv;
    }
  });

  async function resolvePlugins(
    options: Partial<ApolloDriverConfig>,
    nodeEnv: string,
  ) {
    process.env.NODE_ENV = nodeEnv;
    const merged = await driver.mergeDefaultOptions(
      options as ApolloDriverConfig,
    );
    return merged.plugins ?? [];
  }

  const enabled: [string, Partial<ApolloDriverConfig>, string][] = [
    ['neither option is set outside production', {}, 'development'],
    ['"graphiql" is true in production', { graphiql: true }, 'production'],
    ['"playground" is true in production', { playground: true }, 'production'],
    [
      '"graphiql" is an options object in production',
      { graphiql: {} },
      'production',
    ],
    [
      '"graphiql" is true and "playground" is false',
      { graphiql: true, playground: false },
      'development',
    ],
  ];

  const disabled: [string, Partial<ApolloDriverConfig>, string][] = [
    ['neither option is set in production', {}, 'production'],
    [
      '"graphiql" is false outside production',
      { graphiql: false },
      'development',
    ],
    [
      '"playground" is false outside production',
      { playground: false },
      'development',
    ],
    [
      '"graphiql" is false and "playground" is true',
      { graphiql: false, playground: true },
      'development',
    ],
  ];

  it.each(enabled)('registers GraphiQL when %s', async (_, options, env) => {
    const plugins = await resolvePlugins(options, env);
    expect(
      plugins.some((plugin) => plugin instanceof GraphiQLPlaygroundPlugin),
    ).toBe(true);
  });

  it.each(disabled)(
    'disables the landing page when %s',
    async (_, options, env) => {
      const plugins = await resolvePlugins(options, env);
      expect(
        plugins.some((plugin) => plugin instanceof GraphiQLPlaygroundPlugin),
      ).toBe(false);
      // The disabling plugin has to be registered explicitly, otherwise Apollo
      // serves its own default landing page.
      expect(
        plugins.some(
          (plugin) =>
            (plugin as { __internal_plugin_id__?: string })
              .__internal_plugin_id__ === 'LandingPageDisabled',
        ),
      ).toBe(true);
    },
  );

  it('does not mutate the "graphiql" options object supplied by the user', async () => {
    const graphiql = {};
    await resolvePlugins({ graphiql, path: '/graphql' }, 'development');

    expect(graphiql).toEqual({});
  });
});
