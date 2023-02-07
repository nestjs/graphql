import {
  onGatewayReplaceSchemaHookHandler,
  preGatewayExecutionHookHandler,
  preGatewaySubscriptionExecutionHookHandler,
} from '@mercuriusjs/gateway';
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

export interface MercuriusGatewayHooksObject<
  Context extends MercuriusContext = MercuriusContext,
> extends MercuriusHooksObject<Context> {
  preGatewayExecution?:
    | preGatewayExecutionHookHandler<Context>
    | preGatewayExecutionHookHandler<Context>[];
  preGatewaySubscriptionExecution?:
    | preGatewaySubscriptionExecutionHookHandler<Context>
    | preGatewaySubscriptionExecutionHookHandler<Context>[];
  onGatewayReplaceSchema?:
    | onGatewayReplaceSchemaHookHandler
    | onGatewayReplaceSchemaHookHandler[];
}

export interface MercuriusGatewayHooks<
  Context extends MercuriusContext = MercuriusContext,
> {
  hooks?: MercuriusGatewayHooksObject<Context>;
}
