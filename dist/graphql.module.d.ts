import { DynamicModule, OnModuleInit } from '@nestjs/common/interfaces';
import { ApplicationConfig, HttpAdapterHost } from '@nestjs/core';
import { ApolloServerBase } from 'apollo-server-core';
import { GraphQLTypesLoader } from './graphql-types.loader';
import { GraphQLFactory } from './graphql.factory';
import {
  GqlModuleAsyncOptions,
  GqlModuleOptions,
} from './interfaces/gql-module-options.interface';
export declare class GraphQLModule implements OnModuleInit {
  private readonly httpAdapterHost;
  private readonly options;
  private readonly graphqlFactory;
  private readonly graphqlTypesLoader;
  private readonly applicationConfig;
  protected apolloServer: ApolloServerBase;
  constructor(
    httpAdapterHost: HttpAdapterHost,
    options: GqlModuleOptions,
    graphqlFactory: GraphQLFactory,
    graphqlTypesLoader: GraphQLTypesLoader,
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
