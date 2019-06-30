import { GqlModuleOptions } from '../interfaces/gql-module-options.interface';

const defaultOptions: GqlModuleOptions = {
  type: 'express',
  path: '/graphql',
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
