import { DynamicModule, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  GatewayBuildService,
  GatewayModuleAsyncOptions,
  GatewayModuleOptions,
} from '../interfaces';
export declare class GraphQLGatewayModule implements OnModuleInit {
  private readonly httpAdapterHost;
  private readonly buildService;
  private readonly options;
  private apolloServer;
  constructor(
    httpAdapterHost: HttpAdapterHost,
    buildService: GatewayBuildService,
    options: GatewayModuleOptions,
  );
  static forRoot(options: GatewayModuleOptions): DynamicModule;
  static forRootAsync(options: GatewayModuleAsyncOptions): DynamicModule;
  private static createAsyncProviders;
  private static createAsyncOptionsProvider;
  onModuleInit(): Promise<void>;
  private registerGqlServer;
  private registerExpress;
  private registerFastify;
}
