import { Injectable } from '@nestjs/common';
import { Middleware, MiddlewareAction, MiddlewareFn } from '../../interfaces';
import { MiddlewareStorage } from '../storages/middleware.storage';
import { GraphQLFieldResolver } from 'graphql';

@Injectable()
export class ApplyMiddlewareHelper {
  constructor(private readonly middlewareStorage: MiddlewareStorage) {}

  applyMiddleware(
    resolverData: MiddlewareAction,
    middleware: Middleware[],
    resolverHandlerFunction: GraphQLFieldResolver<any, any>,
  ): Promise<any> {
    const { source, args, context, info } = resolverData;

    if (middleware.length === 0) {
      return resolverHandlerFunction(source, args, context, info);
    }

    let middlewareIndex = -1;

    const dispatchHandler = async (currentIndex: number): Promise<void> => {
      if (currentIndex <= middlewareIndex) {
        throw new Error('next() called multiple times');
      }

      middlewareIndex = currentIndex;

      let handlerFn: MiddlewareFn;

      if (currentIndex === middleware.length) {
        handlerFn = () => resolverHandlerFunction(source, args, context, info);
      } else {
        handlerFn = this.middlewareStorage.get(middleware[currentIndex]);
      }

      let nextResult: any = undefined;

      const result = await handlerFn(resolverData, async () => {
        nextResult = await dispatchHandler(currentIndex + 1);

        return nextResult;
      });

      return result !== undefined ? result : nextResult;
    };

    return dispatchHandler(0);
  }
}
