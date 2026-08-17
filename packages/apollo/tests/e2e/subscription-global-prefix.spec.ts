import { ApplicationConfig, HttpAdapterHost } from '@nestjs/core';
import { GraphQLFactory, ResolverDecoratorHost } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { ApolloDriver } from '../../lib/drivers/index.js';
import { ApolloDriverConfig } from '../../lib/interfaces/index.js';

describe('Subscription path with global prefix', () => {
  async function createDriver(prefix: string) {
    const applicationConfig = new ApplicationConfig();
    applicationConfig.setGlobalPrefix(prefix);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ApolloDriver,
        ResolverDecoratorHost,
        { provide: ApplicationConfig, useValue: applicationConfig },
        { provide: HttpAdapterHost, useValue: {} },
        { provide: GraphQLFactory, useValue: {} },
      ],
    }).compile();

    return moduleRef.get(ApolloDriver);
  }

  it('prefixes the http endpoint when useGlobalPrefix is true', async () => {
    const driver = await createDriver('api');
    const merged = await driver.mergeDefaultOptions({
      useGlobalPrefix: true,
    } as ApolloDriverConfig);

    expect(merged.path).toBe('/api/graphql');
  });

  it('prefixes a custom subscription path when useGlobalPrefix is true', async () => {
    const driver = await createDriver('api');
    const merged = await driver.mergeDefaultOptions({
      useGlobalPrefix: true,
      subscriptions: {
        'graphql-ws': { path: '/graphql' },
      },
    } as ApolloDriverConfig);

    expect(merged.subscriptions?.['graphql-ws']).toMatchObject({
      path: '/api/graphql',
    });
  });

  it('prefixes a non-default subscription path when useGlobalPrefix is true', async () => {
    const driver = await createDriver('api');
    const merged = await driver.mergeDefaultOptions({
      useGlobalPrefix: true,
      subscriptions: {
        'graphql-ws': { path: '/subscriptions' },
      },
    } as ApolloDriverConfig);

    expect(merged.subscriptions?.['graphql-ws']).toMatchObject({
      path: '/api/subscriptions',
    });
  });

  it('leaves subscription path untouched when useGlobalPrefix is false', async () => {
    const driver = await createDriver('api');
    const merged = await driver.mergeDefaultOptions({
      useGlobalPrefix: false,
      subscriptions: {
        'graphql-ws': { path: '/graphql' },
      },
    } as ApolloDriverConfig);

    expect(merged.subscriptions?.['graphql-ws']).toMatchObject({
      path: '/graphql',
    });
  });

  it('does not touch boolean subscription protocol shorthand', async () => {
    const driver = await createDriver('api');
    const merged = await driver.mergeDefaultOptions({
      useGlobalPrefix: true,
      subscriptions: {
        'graphql-ws': true,
      },
    } as ApolloDriverConfig);

    expect(merged.subscriptions?.['graphql-ws']).toBe(true);
  });

  it('does not compound the prefix when the same options object is merged twice', async () => {
    const driver = await createDriver('api');
    const options = {
      useGlobalPrefix: true,
      subscriptions: {
        'graphql-ws': { path: '/graphql' },
      },
    } as ApolloDriverConfig;

    await driver.mergeDefaultOptions(options);
    const merged = await driver.mergeDefaultOptions(options);

    expect(merged.subscriptions?.['graphql-ws']).toMatchObject({
      path: '/api/graphql',
    });
  });

  it('leaves the caller subscriptions config untouched', async () => {
    const driver = await createDriver('api');
    const subscriptions = { 'graphql-ws': { path: '/graphql' } };

    await driver.mergeDefaultOptions({
      useGlobalPrefix: true,
      subscriptions,
    } as ApolloDriverConfig);

    expect(subscriptions['graphql-ws'].path).toBe('/graphql');
  });
});
