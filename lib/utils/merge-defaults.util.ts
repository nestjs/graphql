import { GraphQLModuleOptions } from '../graphql.module';
import { extend } from './extend.util';

const defaultOptions: GraphQLModuleOptions = {
  path: '/graphql',
  rootValueResolver: req => req,
  typePaths: ['**/*.graphql'],
  contextResolver: req => undefined,
  graphiQl: {
    endpointURL: '/graphql',
    path: '/graphiql',
  },
};

export function mergeDefaults(
  options: GraphQLModuleOptions,
  defaults: GraphQLModuleOptions = defaultOptions,
): GraphQLModuleOptions {
  const graphiQl = extend(options.graphiQl, defaults.graphiQl);
  return {
    ...defaults,
    ...options,
    graphiQl,
  };
}
