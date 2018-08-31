import { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context.host';

export interface GqlArgumentsHost extends ArgumentsHost {
  getRoot<T = any>(): T;
  getInfo<T = any>(): T;
  getArgs<T = any>(): T;
  getContext<T = any>(): T;
}

export class GqlExecutionContext extends ExecutionContextHost {
  static create(executionContext: ExecutionContext): GqlArgumentsHost {
    return Object.assign(
      {
        getRoot: () => executionContext.getArgByIndex(0),
        getArgs: () => executionContext.getArgByIndex(1),
        getContext: () => executionContext.getArgByIndex(2),
        getInfo: () => executionContext.getArgByIndex(3),
      },
      executionContext,
    );
  }
}
