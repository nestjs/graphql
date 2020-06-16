import { ContextType, ExecutionContext } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { GraphQLArgumentsHost } from './gql-arguments-host';
export declare type GqlContextType = 'graphql' | ContextType;
export declare type GraphQLExecutionContext = GqlExecutionContext;
export declare class GqlExecutionContext extends ExecutionContextHost
  implements GraphQLArgumentsHost {
  static create(context: ExecutionContext): GqlExecutionContext;
  getType<TContext extends string = GqlContextType>(): TContext;
  getRoot<T = any>(): T;
  getArgs<T = any>(): T;
  getContext<T = any>(): T;
  getInfo<T = any>(): T;
}
