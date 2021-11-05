import { GraphQLTypeResolver } from 'graphql';

export type ResolveTypeFn<TSource = any, TContext = any> = (
  ...args: Parameters<GraphQLTypeResolver<TSource, TContext>>
) => any;
