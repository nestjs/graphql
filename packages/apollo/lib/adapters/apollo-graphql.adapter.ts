import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { AbstractGraphQLAdapter } from '@nestjs/graphql-experimental/adapters/abstract-graphql.adapter';
import { GqlModuleOptions } from '@nestjs/graphql-experimental/interfaces';
import { normalizeRoutePath } from '@nestjs/graphql-experimental/utils';
import { ApolloServerBase } from 'apollo-server-core';

@Injectable()
export class ApolloGraphQLAdapter extends AbstractGraphQLAdapter<
  ApolloServerBase,
  GqlModuleOptions
> {
  private _apolloServer: ApolloServerBase;

  get instance(): ApolloServerBase {
    return this._apolloServer;
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

  public async runPreOptionsHooks(apolloOptions: GqlModuleOptions) {
    await this.runExecutorFactoryIfPresent(apolloOptions);
  }

  public stop() {
    return this._apolloServer?.stop();
  }

  private async registerExpress(apolloOptions: GqlModuleOptions) {
    const { ApolloServer } = loadPackage(
      'apollo-server-express',
      'GraphQLModule',
      () => require('apollo-server-express'),
    );
    const path = this.getNormalizedPath(apolloOptions);
    const { disableHealthCheck, onHealthCheck, cors, bodyParserConfig } =
      this.moduleOptions;

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
      this.moduleOptions;

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
    const useGlobalPrefix = prefix && this.moduleOptions.useGlobalPrefix;
    const gqlOptionsPath = normalizeRoutePath(apolloOptions.path);
    return useGlobalPrefix
      ? normalizeRoutePath(prefix) + gqlOptionsPath
      : gqlOptionsPath;
  }

  private async runExecutorFactoryIfPresent(apolloOptions: GqlModuleOptions) {
    if (!apolloOptions.executorFactory) {
      return;
    }
    const executor = await apolloOptions.executorFactory(apolloOptions.schema);
    apolloOptions.executor = executor;
  }
}
