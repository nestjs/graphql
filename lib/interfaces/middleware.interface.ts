import { GraphQLResolveInfo } from 'graphql/type/definition';

export interface MiddlewareAction<
  TSource = any,
  TContext = {},
  TArgs = { [argName: string]: any }
> {
  source: TSource;
  args: TArgs;
  context: TContext;
  info: GraphQLResolveInfo;
}

export type NextFn = () => Promise<any>;

export type MiddlewareFn<
  TSource = any,
  TContext = {},
  TArgs = { [argName: string]: any }
> = (
  action: MiddlewareAction<TSource, TContext, TArgs>,
  next: NextFn,
) => Promise<any>;

export interface MiddlewareInterface<
  TSource = any,
  TContext = {},
  TArgs = { [argName: string]: any }
> {
  use: MiddlewareFn<TContext>;
}

export interface MiddlewareClass<
  TSource = any,
  TContext = {},
  TArgs = { [argName: string]: any }
> {
  new (...args: any[]): MiddlewareInterface<TSource, TContext, TArgs>;
}

export type Middleware<
  TSource = any,
  TContext = {},
  TArgs = { [argName: string]: any }
> =
  | MiddlewareFn<TSource, TContext, TArgs>
  | MiddlewareClass<TSource, TContext, TArgs>;
