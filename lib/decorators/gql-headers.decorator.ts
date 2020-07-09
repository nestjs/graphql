import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IncomingMessage } from 'http';
import { GqlExecutionContext } from '../services';

/**
 * `@GqlHeaders()` Route handler parameter decorator. Extracts the `headers`
 * property from the `req` object and populates the decorated
 * parameter with the value of `headers`.
 *
 * For example: `async update(@GqlHeaders('Cache-Control') cacheControl: string)`
 *
 * @param headerName name of single header property to extract.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 */
export function GqlHeaders(headerName?: string): ParameterDecorator {
  return createParamDecorator(
    (headerName: string | void, context: ExecutionContext) => {
      const ctx = GqlExecutionContext.create(context);
      const request = ctx.getContext().req as IncomingMessage;

      if (headerName) {
        return request.headers[headerName.toLowerCase()];
      }

      return request.headers;
    },
  )(headerName);
}
