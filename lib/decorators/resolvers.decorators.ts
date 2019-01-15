import { ReflectMetadata, Type } from '@nestjs/common';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils';
import * as optional from 'optional';
import { Resolvers } from '../enums/resolvers.enum';
import {
  RESOLVER_DELEGATE_METADATA,
  RESOLVER_NAME_METADATA,
  RESOLVER_PROPERTY_METADATA,
  RESOLVER_TYPE_METADATA,
  SCALAR_NAME_METADATA,
  SCALAR_TYPE_METADATA,
  SUBSCRIPTION_OPTIONS_METADATA,
} from '../graphql.constants';
import {
  AdvancedOptions,
  ClassTypeResolver,
  ResolverClassOptions,
  ReturnTypeFunc,
} from './../external/type-graphql.types';

const {
  FieldResolver,
  Mutation: TypeGqlMutation,
  Query: TypeGqlQuery,
  Resolver: TypeGqlResolver,
  Subscription: TypeGqlSubscription,
} =
  optional('type-graphql') || ({} as any);

export function addResolverMetadata(
  resolver: Resolvers | string | undefined,
  name: string | undefined,
  target?: Object | Function,
  key?: string,
  descriptor?: string,
) {
  ReflectMetadata(RESOLVER_TYPE_METADATA, resolver || name)(
    target,
    key,
    descriptor,
  );
  ReflectMetadata(RESOLVER_NAME_METADATA, name)(target, key, descriptor);
}

export function createPropertyDecorator(
  propertyName?: string,
  typeFunc?: ReturnTypeFunc,
  options?: AdvancedOptions,
): MethodDecorator {
  return (target: Function | Object, key?: string, descriptor?: any) => {
    ReflectMetadata(RESOLVER_NAME_METADATA, propertyName)(
      target,
      key,
      descriptor,
    );
    ReflectMetadata(RESOLVER_PROPERTY_METADATA, true)(target, key, descriptor);
    FieldResolver && FieldResolver(typeFunc, options)(target, key, descriptor);
  };
}

export function createDelegateDecorator(
  propertyName?: string,
  typeFunc?: ReturnTypeFunc,
  options?: AdvancedOptions,
): MethodDecorator {
  return (target: Function | Object, key?: string, descriptor?: any) => {
    ReflectMetadata(RESOLVER_NAME_METADATA, propertyName)(
      target,
      key,
      descriptor,
    );
    ReflectMetadata(RESOLVER_DELEGATE_METADATA, propertyName)(
      target,
      key,
      descriptor,
    );
    FieldResolver && FieldResolver(typeFunc, options)(target, key, descriptor);
  };
}

export function Scalar(name: string): ClassDecorator;
export function Scalar(name: string, typeFunc: ReturnTypeFunc): ClassDecorator;
export function Scalar(
  name: string,
  typeFunc?: ReturnTypeFunc,
): ClassDecorator {
  return (target, key?, descriptor?) => {
    ReflectMetadata(SCALAR_NAME_METADATA, name)(target, key, descriptor);
    ReflectMetadata(SCALAR_TYPE_METADATA, typeFunc)(target, key, descriptor);
  };
}

export function Query(): MethodDecorator;
export function Query(name: string): MethodDecorator;
export function Query(
  typeFunc: ReturnTypeFunc,
  options?: AdvancedOptions,
): MethodDecorator;
export function Query(
  nameOrType?: string | ReturnTypeFunc,
  options?: AdvancedOptions,
): MethodDecorator {
  return (target: Object | Function, key?: string, descriptor?: any) => {
    const name = isString(nameOrType)
      ? nameOrType
      : (options && options.name) || undefined;

    addResolverMetadata(Resolvers.QUERY, name, target, key, descriptor);
    if (!isString(nameOrType)) {
      TypeGqlQuery &&
        TypeGqlQuery(nameOrType, options)(target as Function, key, descriptor);
    }
  };
}

export function Mutation(): MethodDecorator;
export function Mutation(name: string): MethodDecorator;
export function Mutation(
  typeFunc: ReturnTypeFunc,
  options?: AdvancedOptions,
): MethodDecorator;
export function Mutation(
  nameOrType?: string | ReturnTypeFunc,
  options?: AdvancedOptions,
): MethodDecorator {
  return (target: Object | Function, key?: string, descriptor?: any) => {
    const name = isString(nameOrType)
      ? nameOrType
      : (options && options.name) || undefined;

    addResolverMetadata(Resolvers.MUTATION, name, target, key, descriptor);
    if (!isString(nameOrType)) {
      TypeGqlMutation &&
        TypeGqlMutation(nameOrType, options)(
          target as Function,
          key,
          descriptor,
        );
    }
  };
}

export interface SubscriptionOptions {
  filter?: <TPayload = any, TVariables = any>(
    payload: TPayload,
    variables: TVariables,
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
  return (target: Object | Function, key?: string, descriptor?: any) => {
    const name = isString(nameOrType)
      ? nameOrType
      : (options && options.name) || undefined;

    addResolverMetadata(Resolvers.SUBSCRIPTION, name, target, key, descriptor);
    ReflectMetadata(SUBSCRIPTION_OPTIONS_METADATA, options)(
      target,
      key,
      descriptor,
    );

    if (!isString(nameOrType)) {
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

export function Resolver();
export function Resolver(name: string);
export function Resolver(classType: Type<any>, options?: ResolverClassOptions);
export function Resolver(
  typeFunc: ClassTypeResolver,
  options?: ResolverClassOptions,
);
export function Resolver(
  nameOrType?: string | ClassTypeResolver | Type<any>,
  options?: ResolverClassOptions,
) {
  return (target: Object | Function, key?: string, descriptor?: any) => {
    const name = getClassName(nameOrType);

    addResolverMetadata(undefined, name, target, key, descriptor);
    if (!isString(nameOrType)) {
      TypeGqlResolver &&
        TypeGqlResolver(nameOrType, options)(target as Function);
    }
  };
}

const getClassName = (nameOrType: string | Function | Type<any>) => {
  if (isString(nameOrType)) {
    return nameOrType;
  }
  return isConstructor(nameOrType)
    ? nameOrType.name
    : isFunction(nameOrType) ? (nameOrType as Function)().name : undefined;
};

function isConstructor(obj: any) {
  return (
    !!obj.prototype &&
    !!obj.prototype.constructor &&
    !!obj.prototype.constructor.name
  );
}

export const ResolveProperty = createPropertyDecorator;
export const DelegateProperty = createDelegateDecorator;
