import { ResolverDecoratorHost } from '@nestjs/graphql';
import { FastifyInstance } from 'fastify';

const REQUEST_HOOK_STATE = Symbol('nestjs:mercurius:requestHookState');

/**
 * Wires the "request start"/"request end" hooks registered through the
 * `ResolverDecoratorHost` into the Mercurius request lifecycle so that
 * consumers can instrument (and measure) a single GraphQL operation.
 *
 * Note: `onResolution` is not triggered when the document cannot be parsed
 * or validated, so the "request end" hook only runs for operations that
 * actually reached the execution phase.
 */
export function registerMercuriusRequestHooks(
  app: FastifyInstance,
  resolverDecoratorHost?: ResolverDecoratorHost,
): void {
  if (!resolverDecoratorHost) {
    return;
  }

  // Even in the gateway setup, the request lifecycle hooks are registered
  // on the underlying Mercurius instance ("graphql"), as the gateway
  // decorator ("graphqlGateway") only supports gateway-specific hooks.
  const graphql = (app as any).graphql;

  graphql.addHook(
    'preParsing',
    async (_schema: any, source: any, context: any) => {
      if (!resolverDecoratorHost.hasRequestHooks() || !context) {
        return;
      }

      const hookContext = {
        query: source,
        ...extractRequestPayload(context),
        context,
      };
      context[REQUEST_HOOK_STATE] = {
        hookContext,
        state: resolverDecoratorHost.onRequestStart(hookContext),
      };
    },
  );

  graphql.addHook('onResolution', async (execution: any, context: any) => {
    const pending = context?.[REQUEST_HOOK_STATE];
    if (!pending) {
      return;
    }
    context[REQUEST_HOOK_STATE] = undefined;

    resolverDecoratorHost.onRequestEnd({
      ...pending.hookContext,
      errors: execution?.errors,
      state: pending.state,
    });
  });
}

function extractRequestPayload(context: any): {
  operationName?: string;
  variables?: Record<string, unknown>;
} {
  const body = context.reply?.request?.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {};
  }
  return {
    operationName: body.operationName,
    variables: body.variables,
  };
}
