import {
  MercuriusContext,
  onGatewayReplaceSchemaHookHandler,
  onResolutionHookHandler,
  onSubscriptionEndHookHandler,
  onSubscriptionResolutionHookHandler,
  preExecutionHookHandler,
  preGatewayExecutionHookHandler,
  preGatewaySubscriptionExecutionHookHandler,
  preParsingHookHandler,
  preSubscriptionExecutionHookHandler,
  preSubscriptionParsingHookHandler,
  preValidationHookHandler,
} from 'mercurius';

interface MercuriusHookBase<T extends string> {
  name: T;
  hook: unknown;
}

export interface MercuriusPreParsingHook<
  Context extends MercuriusContext = MercuriusContext,
> extends MercuriusHookBase<'preParsing'> {
  hook: preParsingHookHandler<Context>;
}

export interface MercuriusPreValidationHook<
  Context extends MercuriusContext = MercuriusContext,
> extends MercuriusHookBase<'preValidation'> {
  hook: preValidationHookHandler<Context>;
}

export interface MercuriusPreExecutionHook<
  Context extends MercuriusContext = MercuriusContext,
> extends MercuriusHookBase<'preExecution'> {
  hook: preExecutionHookHandler<Context>;
}

export interface MercuriusOnResolutionHook<
  Context extends MercuriusContext = MercuriusContext,
> extends MercuriusHookBase<'onResolution'> {
  hook: onResolutionHookHandler<Context>;
}

export interface MercuriusPreSubscriptionParsingHook<
  Context extends MercuriusContext = MercuriusContext,
> extends MercuriusHookBase<'preSubscriptionParsing'> {
  hook: preSubscriptionParsingHookHandler<Context>;
}

export interface MercuriusPreSubscriptionExecutionHook<
  Context extends MercuriusContext = MercuriusContext,
> extends MercuriusHookBase<'preSubscriptionExecution'> {
  hook: preSubscriptionExecutionHookHandler<Context>;
}

export interface MercuriusOnSubscriptionResolutionHook<
  Context extends MercuriusContext = MercuriusContext,
> extends MercuriusHookBase<'onSubscriptionResolution'> {
  hook: onSubscriptionResolutionHookHandler<Context>;
}

export interface MercuriusOnSubscriptionEndHook<
  Context extends MercuriusContext = MercuriusContext,
> extends MercuriusHookBase<'onSubscriptionEnd'> {
  hook: onSubscriptionEndHookHandler<Context>;
}

export type MercuriusHook<Context extends MercuriusContext = MercuriusContext> =

    | MercuriusPreParsingHook<Context>
    | MercuriusPreValidationHook<Context>
    | MercuriusPreExecutionHook<Context>
    | MercuriusOnResolutionHook<Context>
    | MercuriusPreSubscriptionParsingHook<Context>
    | MercuriusPreSubscriptionExecutionHook<Context>
    | MercuriusOnSubscriptionResolutionHook<Context>
    | MercuriusOnSubscriptionEndHook<Context>;

export interface MercuriusHooks<
  Context extends MercuriusContext = MercuriusContext,
> {
  hooks?: MercuriusHook<Context>[] | null;
}

export interface MercuriusPreGatewayExecutionHook<
  Context extends MercuriusContext = MercuriusContext,
> extends MercuriusHookBase<'preGatewayExecution'> {
  hook: preGatewayExecutionHookHandler<Context>;
}

export interface MercuriusPreGatewaySubscriptionExecutionHook<
  Context extends MercuriusContext = MercuriusContext,
> extends MercuriusHookBase<'preGatewaySubscriptionExecution'> {
  hook: preGatewaySubscriptionExecutionHookHandler<Context>;
}

export interface MercuriusOnGatewayReplaceSchemaHook
  extends MercuriusHookBase<'onGatewayReplaceSchema'> {
  hook: onGatewayReplaceSchemaHookHandler;
}

export type MercuriusGatewayHook<
  Context extends MercuriusContext = MercuriusContext,
> =
  | MercuriusHook<Context>
  | MercuriusPreGatewayExecutionHook<Context>
  | MercuriusPreGatewaySubscriptionExecutionHook<Context>
  | MercuriusOnGatewayReplaceSchemaHook;

export interface MercuriusGatewayHooks<
  Context extends MercuriusContext = MercuriusContext,
> {
  hooks?: MercuriusGatewayHook<Context>[] | null;
}
