import { GraphQLResolveInfo } from 'graphql';
import { FieldMiddleware } from '../interfaces';

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
    root: TSource,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ): TOutput | Promise<TOutput> => {
    let index = -1;

    const run = async (currentIndex: number): Promise<TOutput> => {
      if (currentIndex <= index) {
        throw new Error('next() called multiple times');
      }

      index = currentIndex;
      let middlewareFn: FieldMiddleware;

      if (currentIndex === middlewareFunctions.length) {
        middlewareFn = originalResolveFnFactory(
          root,
          args,
          context,
          info,
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
