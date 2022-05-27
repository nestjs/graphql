import { ContextId, createContextId } from '@nestjs/core';
import { REQUEST_CONTEXT_ID } from '@nestjs/core/router/request/request-constants';

export abstract class ContextIdFactory {
  abstract create(): ContextId;

  abstract getByRequest<T extends Record<any, any> = any>(
    request: T,
  ): ContextId;
}

export class GraphqlContextIdFactory implements ContextIdFactory {
  create(): ContextId {
    return createContextId();
  }
  getByRequest<T extends Record<any, any> = any>(gqlContext: T): ContextId {
    if (!gqlContext) {
      return this.create();
    }
    if (gqlContext[REQUEST_CONTEXT_ID as any]) {
      return gqlContext[REQUEST_CONTEXT_ID as any];
    }
    if (gqlContext.req && gqlContext.req[REQUEST_CONTEXT_ID]) {
      return gqlContext.req[REQUEST_CONTEXT_ID];
    }
    return createContextId();
  }
}
