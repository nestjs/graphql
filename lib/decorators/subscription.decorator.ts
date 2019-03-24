import { SetMetadata } from '@nestjs/common';
import { isString } from '@nestjs/common/utils/shared.utils';
import * as optional from 'optional';
import { Resolvers } from '../enums/resolvers.enum';
import { SUBSCRIPTION_OPTIONS_METADATA } from '../graphql.constants';
import {
  AdvancedOptions,
  ReturnTypeFunc,
} from './../external/type-graphql.types';
import { addResolverMetadata } from './resolvers.utils';

const { Subscription: TypeGqlSubscription } =
  optional('type-graphql') || ({} as any);

export interface SubscriptionOptions {
  filter?: <TPayload = any, TVariables = any, TContext = any>(
    payload: TPayload,
    variables: TVariables,
    context: TContext,
  ) => boolean;
  resolve?: <
    TPayload = any,
    TArgs = any,
    TContext = any,
    TInfo = any,
    TReturnValue = any
  >(
    payload: TPayload,
    args: TArgs,
    context: TContext,
    info: TInfo,
  ) => TReturnValue;
}

export function Subscription(): MethodDecorator;
export function Subscription(name: string): MethodDecorator;
export function Subscription(
  name: string,
  options: SubscriptionOptions,
): MethodDecorator;
export function Subscription(
  typeFunc: ReturnTypeFunc,
  options?: AdvancedOptions & SubscriptionOptions,
): MethodDecorator;
export function Subscription(
  nameOrType?: string | ReturnTypeFunc,
  options: AdvancedOptions & SubscriptionOptions = {},
): MethodDecorator {
  return (
    target: Object | Function,
    key?: string | symbol,
    descriptor?: any,
  ) => {
    const name = isString(nameOrType)
      ? nameOrType
      : (options && options.name) || undefined;

    addResolverMetadata(Resolvers.SUBSCRIPTION, name, target, key, descriptor);
    SetMetadata(SUBSCRIPTION_OPTIONS_METADATA, options)(
      target,
      key,
      descriptor,
    );

    if (nameOrType && !isString(nameOrType)) {
      const topics = ['undefined']; // NOTE: Added to omit options validation
      TypeGqlSubscription &&
        TypeGqlSubscription(nameOrType, { topics, ...options })(
          target as Function,
          key,
          descriptor,
        );
    }
  };
}
