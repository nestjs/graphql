import { Injectable, Type } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import {
  Middleware,
  MiddlewareInterface,
  MiddlewareFn,
} from '../../interfaces';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class MiddlewareStorage {
  private readonly storage = new Map<Function, MiddlewareFn>();

  constructor(private readonly moduleRef: ModuleRef) {}

  addMiddleware(middleware: Middleware) {
    if (typeof middleware.prototype !== 'undefined') {
      const instance = this.moduleRef.get(middleware as Type<any>, {
        strict: false,
      }) as MiddlewareInterface;

      this.storage.set(middleware, instance.use.bind(instance));
    } else if (isFunction(middleware)) {
      this.storage.set(middleware, middleware as MiddlewareFn);
    } else {
      throw new Error('Invalid Middleware.  Must be of type "Middleware"');
    }
  }

  get(middleware: Middleware): MiddlewareFn {
    return this.storage.get(middleware);
  }
}
