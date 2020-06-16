import { DynamicModule, OnModuleInit } from '@nestjs/common';
import { ApplicationConfig, HttpAdapterHost } from '@nestjs/core';
import { GraphQLTypesLoader } from '../graphql-types.loader';
import { GraphQLFactory } from '../graphql.factory';
import { GqlModuleAsyncOptions, GqlModuleOptions } from '../interfaces';
import { GraphQLFederationFactory } from './graphql-federation.factory';
export declare class GraphQLFederationModule implements OnModuleInit {
  private readonly httpAdapterHost;
  private readonly options;
  private readonly graphqlFederationFactory;
  private readonly graphqlTypesLoader;
  private readonly graphqlFactory;
  private readonly applicationConfig;
  private apolloServer;
  constructor(
    httpAdapterHost: HttpAdapterHost,
    options: GqlModuleOptions,
    graphqlFederationFactory: GraphQLFederationFactory,
    graphqlTypesLoader: GraphQLTypesLoader,
    graphqlFactory: GraphQLFactory,
    applicationConfig: ApplicationConfig,
  );
  static forRoot(options?: GqlModuleOptions): DynamicModule;
  static forRootAsync(options: GqlModuleAsyncOptions): DynamicModule;
  private static createAsyncProviders;
  private static createAsyncOptionsProvider;
  onModuleInit(): Promise<void>;
  private registerGqlServer;
  private registerExpress;
  private registerFastify;
  private getNormalizedPath;
}
