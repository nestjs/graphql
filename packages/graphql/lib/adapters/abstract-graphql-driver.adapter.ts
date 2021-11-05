import { Inject } from '@nestjs/common';
import { ApplicationConfig, HttpAdapterHost } from '@nestjs/core';
import { GRAPHQL_MODULE_OPTIONS } from '../graphql.constants';
import { GqlModuleOptions } from '../interfaces';

export abstract class AbstractGraphQLDriverAdapter<
  TDriver = unknown,
  TOptions extends GqlModuleOptions = GqlModuleOptions,
> {
  @Inject()
  protected readonly httpAdapterHost: HttpAdapterHost;

  @Inject()
  protected readonly applicationConfig: ApplicationConfig;

  @Inject(GRAPHQL_MODULE_OPTIONS)
  protected readonly moduleOptions: GqlModuleOptions;

  abstract get instance(): TDriver;

  public abstract start(options: TOptions): Promise<unknown>;
  public abstract runPreOptionsHooks?(options: TOptions): Promise<void>;
  public abstract stop(): Promise<void>;
}
