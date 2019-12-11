import { ExecutionContext } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { GraphQLArgumentsHost } from './gql-arguments-host';

export type GraphQLExecutionContext = GqlExecutionContext;

export class GqlExecutionContext extends ExecutionContextHost
  implements GraphQLArgumentsHost {
  static create(context: ExecutionContext): GqlExecutionContext {
    return new GqlExecutionContext(
      context.getArgs(),
      context.getClass(),
      context.getHandler(),
    );
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

  switchToRpc() {
    return Object.assign(this, {
      getData: (): undefined => undefined,
      getContext: (): undefined => undefined,
    });
  }

  switchToHttp() {
    return Object.assign(this, {
      getRequest: (): undefined => undefined,
      getResponse: (): undefined => undefined,
      getNext: (): undefined => undefined,
    });
  }

  switchToWs() {
    return Object.assign(this, {
      getClient: (): undefined => undefined,
      getData: (): undefined => undefined,
    });
  }
}
