import { Inject } from '@nestjs/common';
import { ApplicationConfig, HttpAdapterHost } from '@nestjs/core';
import { GraphQLFactory } from '../graphql.factory';
import { GqlModuleOptions, GraphQLDriver } from '../interfaces';
import { normalizeRoutePath } from '../utils';

export abstract class AbstractGraphQLDriver<
  TOptions extends Record<string, any> = GqlModuleOptions,
> implements GraphQLDriver<TOptions>
{
  @Inject()
  protected readonly httpAdapterHost: HttpAdapterHost;

  @Inject()
  protected readonly applicationConfig: ApplicationConfig;

  @Inject()
  protected readonly graphQlFactory: GraphQLFactory;

  public abstract start(options: TOptions): Promise<unknown>;
  public abstract stop(): Promise<void>;

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
    (clonedOptions as Record<string, unknown>).path =
      this.getNormalizedPath(clonedOptions);
    return clonedOptions;
  }

  public subscriptionWithFilter(
    instanceRef: unknown,
    filterFn: (
      payload: any,
      variables: any,
      context: any,
    ) => boolean | Promise<boolean>,
    createSubscribeContext: Function,
  ) {
    return createSubscribeContext();
  }

  protected getNormalizedPath(options: TOptions): string {
    const prefix = this.applicationConfig.getGlobalPrefix();
    const useGlobalPrefix = prefix && options.useGlobalPrefix;
    const gqlOptionsPath = normalizeRoutePath(options.path);
    return useGlobalPrefix
      ? normalizeRoutePath(prefix) + gqlOptionsPath
      : gqlOptionsPath;
  }
}
