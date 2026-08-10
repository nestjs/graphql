import { Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';

/**
 * Context passed to the "request start" hook.
 * @publicApi
 */
export interface GqlRequestStartHookContext {
  /**
   * Raw GraphQL document sent by the client (if available).
   */
  query?: string;
  /**
   * Name of the operation being executed (if provided by the client).
   */
  operationName?: string;
  /**
   * Variables sent along with the operation.
   */
  variables?: Record<string, unknown>;
  /**
   * GraphQL context object associated with this request.
   */
  context?: Record<string, unknown>;
}

/**
 * Context passed to the "request end" hook.
 * @publicApi
 */
export interface GqlRequestEndHookContext extends GqlRequestStartHookContext {
  /**
   * Errors collected during the execution of the operation (if any).
   */
  errors?: readonly GraphQLError[];
  /**
   * Value returned from the corresponding "request start" hook.
   * Useful to carry over instrumentation state (spans, timestamps, etc.).
   */
  state?: unknown;
}

/**
 * @publicApi
 */
export type GqlRequestStartHook = (
  context: GqlRequestStartHookContext,
) => unknown;

/**
 * @publicApi
 */
export type GqlRequestEndHook = (context: GqlRequestEndHookContext) => void;

/**
 * @publicApi
 */
@Injectable()
export class ResolverDecoratorHost {
  private decorator: (
    fn: (...args: unknown[]) => void,
  ) => (...args: unknown[]) => void;
  private onRequestStartHook: GqlRequestStartHook;
  private onRequestEndHook: GqlRequestEndHook;

  setDecorator(
    decorator: (
      fn: (...args: unknown[]) => void,
    ) => (...args: unknown[]) => void,
  ): void {
    this.decorator = decorator;
  }

  getDecorator(): (...args: unknown[]) => void {
    return this.decorator;
  }

  decorate(target: (...args: unknown[]) => void): (...args: unknown[]) => void {
    if (!this.decorator) {
      return target;
    }

    return this.decorator(target);
  }

  /**
   * Registers a hook that is called right before a GraphQL operation
   * starts being processed. Whatever it returns is passed back to the
   * "request end" hook through the `state` property.
   */
  setOnRequestStartHook(hook: GqlRequestStartHook): void {
    this.onRequestStartHook = hook;
  }

  getOnRequestStartHook(): GqlRequestStartHook {
    return this.onRequestStartHook;
  }

  /**
   * Registers a hook that is called once a GraphQL operation has been
   * fully processed (right before the response is sent back to the client).
   */
  setOnRequestEndHook(hook: GqlRequestEndHook): void {
    this.onRequestEndHook = hook;
  }

  getOnRequestEndHook(): GqlRequestEndHook {
    return this.onRequestEndHook;
  }

  /**
   * Indicates whether any of the request lifecycle hooks has been registered.
   */
  hasRequestHooks(): boolean {
    return !!(this.onRequestStartHook || this.onRequestEndHook);
  }

  onRequestStart(context: GqlRequestStartHookContext): unknown {
    return this.onRequestStartHook?.(context);
  }

  onRequestEnd(context: GqlRequestEndHookContext): void {
    this.onRequestEndHook?.(context);
  }
}
