import { GraphQLResolveInfo } from 'graphql';
import { FieldMiddleware } from '../interfaces/index.js';
import { normalizeResolverArgs } from './normalize-resolver-args.js';

export function decorateFieldResolverWithMiddleware<
  TSource extends object = any,
  TContext = {},
  TArgs = { [argName: string]: any },
  TOutput = any,
>(
  originalResolveFnFactory: (
    ...args: [TSource, TArgs, TContext, GraphQLResolveInfo]
  ) => Function,
  middlewareFunctions: FieldMiddleware[] = [],
) {
  return (
    ...resolverArgs: [TSource, TArgs, TContext, GraphQLResolveInfo]
  ): TOutput | Promise<TOutput> => {
    // Reference resolvers are called with "(reference, context, info)" and
    // "resolveType" callbacks with "(value, context, info, abstractType)":
    // only the middleware get the arguments laid out like those of a field
    // resolver (with no arguments object, an empty one), the resolver itself
    // gets them as they were passed
    const [root, args = {} as TArgs, context, info] = normalizeResolverArgs(
      resolverArgs,
    ) as [TSource, TArgs, TContext, GraphQLResolveInfo];
    let index = -1;

    const run = async (currentIndex: number): Promise<TOutput> => {
      if (currentIndex <= index) {
        throw new Error('next() called multiple times');
      }

      index = currentIndex;
      let middlewareFn: FieldMiddleware;

      if (currentIndex === middlewareFunctions.length) {
        middlewareFn = originalResolveFnFactory(
          ...resolverArgs,
        ) as FieldMiddleware;
      } else {
        middlewareFn = middlewareFunctions[currentIndex];
      }

      let tempResult: TOutput = undefined;
      const result = await middlewareFn(
        {
          info,
          args,
          context,
          source: root,
        },
        async () => {
          tempResult = await run(currentIndex + 1);
          return tempResult;
        },
      );

      return result !== undefined ? result : tempResult;
    };
    return run(0);
  };
}
