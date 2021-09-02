import { ArgumentsHost } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

export interface GraphQLArgumentsHost extends ArgumentsHost {
  getRoot<T = any>(): T;
  getInfo<T = any>(): T;
  getArgs<T = any>(): T;
  getContext<T = any>(): T;
}

export class GqlArgumentsHost
  extends ExecutionContextHost
  implements GraphQLArgumentsHost
{
  static create(context: ArgumentsHost): GqlArgumentsHost {
    const type = context.getType();
    const gqlContext = new GqlArgumentsHost(context.getArgs());
    gqlContext.setType(type);
    return gqlContext;
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
