import { ContextType, ExecutionContext } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { GraphQLArgumentsHost } from './gql-arguments-host';
import { normalizeResolverArgs } from '../utils/normalize-resolver-args';

export type GqlContextType = 'graphql' | ContextType;
export type GraphQLExecutionContext = GqlExecutionContext;

export class GqlExecutionContext
  extends ExecutionContextHost
  implements GraphQLArgumentsHost
{
  static create(context: ExecutionContext): GqlExecutionContext {
    const type = context.getType();
    const gqlContext = new GqlExecutionContext(
      normalizeResolverArgs(context.getArgs()),
      context.getClass(),
      context.getHandler(),
    );
    gqlContext.setType(type);
    return gqlContext;
  }

  getType<TContext extends string = GqlContextType>(): TContext {
    return super.getType();
  }

  getRoot<T = any>(): T {
    return this.getArgByIndex(0);
  }

  getArgs<T = any>(): T {
    return this.getArgByIndex(1);
  }

  getContext<T = any>(): T {
    return this.getArgByIndex(2);
  }

  getInfo<T = any>(): T {
    return this.getArgByIndex(3);
  }
}
