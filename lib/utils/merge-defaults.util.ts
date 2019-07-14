import { GqlModuleOptions } from '../interfaces/gql-module-options.interface';

const defaultOptions: GqlModuleOptions = {
  path: '/graphql',
  fieldResolverEnhancers: [],
};

export function mergeDefaults(
  options: GqlModuleOptions,
  defaults: GqlModuleOptions = defaultOptions,
): GqlModuleOptions {
  return {
    ...defaults,
    ...options,
  };
}
