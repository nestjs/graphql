import { ApplicationConfig } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AbstractGraphQLDriver, GraphQLModule } from '../lib';

class StubGraphQLDriver extends AbstractGraphQLDriver {
  public async start(): Promise<void> {}
  public async stop(): Promise<void> {}
}

describe('GraphQLModule (global prefix middleware)', () => {
  it('should auto-exclude the GraphQL path from the global prefix when "useGlobalPrefix" is not enabled (issue #3180)', async () => {
    const applicationConfig = new ApplicationConfig();
    applicationConfig.setGlobalPrefix('prefix');

    const module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot({
          driver: StubGraphQLDriver,
        }),
      ],
    })
      .overrideProvider(ApplicationConfig)
      .useValue(applicationConfig)
      .compile();

    await module.init();

    const exclude = applicationConfig.getGlobalPrefixOptions().exclude ?? [];
    const excludedPaths = exclude.map((route) => route.path);
    expect(excludedPaths).toContain('/graphql');
  });

  it('should not auto-exclude the GraphQL path when "useGlobalPrefix" is enabled', async () => {
    const applicationConfig = new ApplicationConfig();
    applicationConfig.setGlobalPrefix('prefix');

    const module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot({
          driver: StubGraphQLDriver,
          useGlobalPrefix: true,
        }),
      ],
    })
      .overrideProvider(ApplicationConfig)
      .useValue(applicationConfig)
      .compile();

    await module.init();

    const exclude = applicationConfig.getGlobalPrefixOptions().exclude ?? [];
    const excludedPaths = exclude.map((route) => route.path);
    expect(excludedPaths).not.toContain('/graphql');
  });

  it('should auto-exclude the GraphQL path even before "setGlobalPrefix" is called, so it persists once the prefix is later set', async () => {
    const applicationConfig = new ApplicationConfig();

    const module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot({
          driver: StubGraphQLDriver,
        }),
      ],
    })
      .overrideProvider(ApplicationConfig)
      .useValue(applicationConfig)
      .compile();

    await module.init();

    const exclude = applicationConfig.getGlobalPrefixOptions().exclude ?? [];
    const excludedPaths = exclude.map((route) => route.path);
    expect(excludedPaths).toContain('/graphql');
  });
});
