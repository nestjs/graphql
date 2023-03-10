import {
  MercuriusContext,
  onResolutionHookHandler,
  onSubscriptionEndHookHandler,
  onSubscriptionResolutionHookHandler,
  preExecutionHookHandler,
  preParsingHookHandler,
  preSubscriptionExecutionHookHandler,
  preSubscriptionParsingHookHandler,
  preValidationHookHandler,
} from 'mercurius';

export interface MercuriusHooksObject<
  Context extends MercuriusContext = MercuriusContext,
> {
  preParsing?:
    | preParsingHookHandler<Context>
    | preParsingHookHandler<Context>[];
  preValidation?:
    | preValidationHookHandler<Context>
    | preValidationHookHandler<Context>[];
  preExecution?:
    | preExecutionHookHandler<Context>
    | preExecutionHookHandler<Context>[];
  onResolution?:
    | onResolutionHookHandler<Context>
    | onResolutionHookHandler<Context>[];
  preSubscriptionParsing?:
    | preSubscriptionParsingHookHandler<Context>
    | preSubscriptionParsingHookHandler<Context>[];
  preSubscriptionExecution?:
    | preSubscriptionExecutionHookHandler<Context>
    | preSubscriptionExecutionHookHandler<Context>[];
  onSubscriptionResolution?:
    | onSubscriptionResolutionHookHandler<Context>
    | onSubscriptionResolutionHookHandler<Context>[];
  onSubscriptionEnd?:
    | onSubscriptionEndHookHandler<Context>
    | onSubscriptionEndHookHandler<Context>[];
}

export interface MercuriusHooks<
  Context extends MercuriusContext = MercuriusContext,
> {
  hooks?: MercuriusHooksObject<Context>;
}
