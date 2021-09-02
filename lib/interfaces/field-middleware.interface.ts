import { GraphQLResolveInfo } from 'graphql';

export interface MiddlewareContext<
  TSource = any,
  TContext = any,
  TArgs = { [argName: string]: any },
> {
  source: TSource;
  args: TArgs;
  context: TContext;
  info: GraphQLResolveInfo;
}

export type NextFn<T = any> = () => Promise<T>;

export interface FieldMiddleware<
  TSource = any,
  TContext = any,
  TArgs = { [argName: string]: any },
  TOutput = any,
> {
  (ctx: MiddlewareContext<TSource, TContext, TArgs>, next: NextFn):
    | Promise<TOutput>
    | TOutput;
}
