import { SetMetadata } from '@nestjs/common';
import { isString } from '@nestjs/common/utils/shared.utils';
import { Resolvers } from '../enums/resolvers.enum';
import { SUBSCRIPTION_OPTIONS_METADATA } from '../graphql.constants';
import { lazyMetadataStorage } from '../storages/lazy-metadata.storage';
import {
  AdvancedOptions,
  ReturnTypeFunc,
} from './../external/type-graphql.types';
import { addResolverMetadata } from './resolvers.utils';

let TypeGqlSubscription: Function;
try {
  TypeGqlSubscription = require('type-graphql').Subscription;
} catch (e) {}

export interface SubscriptionOptions {
  filter?: (
    payload: any,
    variables: any,
    context: any,
  ) => boolean | Promise<boolean>;
  resolve?: (
    payload: any,
    args: any,
    context: any,
    info: any,
  ) => any | Promise<any>;
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
        lazyMetadataStorage.store(() =>
          TypeGqlSubscription(nameOrType, { topics, ...options })(
            target as Function,
            key,
            descriptor,
          ),
        );
    }
  };
}
