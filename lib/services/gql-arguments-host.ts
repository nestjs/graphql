import { ArgumentsHost } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { mergeArgumentsHost } from '../utils/merge-arguments-host.util';

export interface GraphQLArgumentsHost extends ArgumentsHost {
  getRoot<T = any>(): T;
  getInfo<T = any>(): T;
  getArgs<T = any>(): T;
  getContext<T = any>(): T;
}

export class GqlArgumentsHost extends ExecutionContextHost {
  static create(host: ArgumentsHost): GraphQLArgumentsHost {
    return mergeArgumentsHost<GraphQLArgumentsHost>(host);
  }
}
