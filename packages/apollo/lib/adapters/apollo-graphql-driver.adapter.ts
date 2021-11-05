import { HttpAdapterHost, Inject } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { ApplicationConfig } from '@nestjs/core';
import { AbstractGraphQLDriverAdapter } from '@nestjs/graphql-experimental/adapters/abstract-graphql-driver.adapter';
import { GRAPHQL_MODULE_OPTIONS } from '@nestjs/graphql-experimental/graphql.constants';
import { GqlModuleOptions } from '@nestjs/graphql-experimental/interfaces';
import { normalizeRoutePath } from '@nestjs/graphql-experimental/utils';
import { ApolloServerBase } from 'apollo-server-core';

export class ApolloGraphQLDriverAdapter extends AbstractGraphQLDriverAdapter {
  private _apolloServer: ApolloServerBase;

  get apolloServer(): ApolloServerBase {
    return this._apolloServer;
  }

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly applicationConfig: ApplicationConfig,
    @Inject(GRAPHQL_MODULE_OPTIONS) private readonly options: GqlModuleOptions,
  ) {
    super();
  }

  public async start(apolloOptions: GqlModuleOptions) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName === 'express') {
      await this.registerExpress(apolloOptions);
    } else if (platformName === 'fastify') {
      await this.registerFastify(apolloOptions);
    } else {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }
  }

  private async registerExpress(apolloOptions: GqlModuleOptions) {
    const { ApolloServer } = loadPackage(
      'apollo-server-express',
      'GraphQLModule',
      () => require('apollo-server-express'),
    );
    const path = this.getNormalizedPath(apolloOptions);
    const { disableHealthCheck, onHealthCheck, cors, bodyParserConfig } =
      this.options;

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();
    const apolloServer = new ApolloServer(apolloOptions as any);
    await apolloServer.start();

    apolloServer.applyMiddleware({
      app,
      path,
      disableHealthCheck,
      onHealthCheck,
      cors,
      bodyParserConfig,
    });

    this._apolloServer = apolloServer;
  }

  private async registerFastify(apolloOptions: GqlModuleOptions) {
    const { ApolloServer } = loadPackage(
      'apollo-server-fastify',
      'GraphQLModule',
      () => require('apollo-server-fastify'),
    );

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const app = httpAdapter.getInstance();
    const path = this.getNormalizedPath(apolloOptions);

    const apolloServer = new ApolloServer(apolloOptions as any);
    await apolloServer.start();
    const { disableHealthCheck, onHealthCheck, cors, bodyParserConfig } =
      this.options;

    await app.register(
      apolloServer.createHandler({
        disableHealthCheck,
        onHealthCheck,
        cors,
        bodyParserConfig,
        path,
      }),
    );

    this._apolloServer = apolloServer;
  }

  private getNormalizedPath(apolloOptions: GqlModuleOptions): string {
    const prefix = this.applicationConfig.getGlobalPrefix();
    const useGlobalPrefix = prefix && this.options.useGlobalPrefix;
    const gqlOptionsPath = normalizeRoutePath(apolloOptions.path);
    return useGlobalPrefix
      ? normalizeRoutePath(prefix) + gqlOptionsPath
      : gqlOptionsPath;
  }

  public async runOptionsHooks(apolloOptions: GqlModuleOptions) {
    await this.runExecutorFactoryIfPresent(apolloOptions);
  }

  public stop() {
    return this._apolloServer?.stop();
  }

  private async runExecutorFactoryIfPresent(apolloOptions: GqlModuleOptions) {
    if (!apolloOptions.executorFactory) {
      return;
    }
    const executor = await apolloOptions.executorFactory(apolloOptions.schema);
    apolloOptions.executor = executor;
  }
}
