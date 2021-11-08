import { Inject } from '@nestjs/common';
import { ApplicationConfig, HttpAdapterHost } from '@nestjs/core';
import { GqlModuleOptions } from '../interfaces';
import { wrapContextResolver } from '../utils';

export abstract class AbstractGraphQLAdapter<
  TDriver = unknown,
  TOptions extends GqlModuleOptions = GqlModuleOptions,
> {
  @Inject()
  protected readonly httpAdapterHost: HttpAdapterHost;

  @Inject()
  protected readonly applicationConfig: ApplicationConfig;

  abstract get instance(): TDriver;

  public abstract start(options: TOptions): Promise<unknown>;
  public abstract stop(): Promise<void>;

  public async runPreOptionsHooks(options: TOptions): Promise<void> {}
  public async mergeDefaultOptions(
    options: TOptions,
    defaults: Record<string, any> = {
      path: '/graphql',
      fieldResolverEnhancers: [],
    },
  ): Promise<TOptions> {
    const clonedOptions = {
      ...defaults,
      ...options,
    };
    wrapContextResolver(clonedOptions, options);
    return clonedOptions;
  }
}
