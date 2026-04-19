import { ApplicationConfig, HttpAdapterHost } from '@nestjs/core';
import { GraphQLFactory } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { ApolloDriver } from '../../lib/drivers';
import { ApolloDriverConfig } from '../../lib/interfaces';

describe('Subscription path with global prefix', () => {
  async function createDriver(prefix: string) {
    const applicationConfig = new ApplicationConfig();
    applicationConfig.setGlobalPrefix(prefix);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ApolloDriver,
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
        'subscriptions-transport-ws': { path: '/graphql' },
      },
    } as ApolloDriverConfig);

    expect(merged.subscriptions?.['graphql-ws']).toMatchObject({
      path: '/api/graphql',
    });
    expect(merged.subscriptions?.['subscriptions-transport-ws']).toMatchObject({
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
});
