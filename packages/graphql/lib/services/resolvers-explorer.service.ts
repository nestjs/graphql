import { Inject, Injectable, Logger } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import {
  ContextIdFactory,
  createContextId,
  MetadataScanner,
  ModuleRef,
  ModulesContainer,
  REQUEST,
} from '@nestjs/core';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ParamMetadata } from '@nestjs/core/helpers/interfaces/params-metadata.interface';
import { Injector } from '@nestjs/core/injector/injector';
import {
  ContextId,
  InstanceWrapper,
} from '@nestjs/core/injector/instance-wrapper';
import { InternalCoreModule } from '@nestjs/core/injector/internal-core-module';
import { Module } from '@nestjs/core/injector/module';
import { REQUEST_CONTEXT_ID } from '@nestjs/core/router/request/request-constants';
import { GraphQLResolveInfo } from 'graphql';
import { head, identity } from 'lodash';
import { SubscriptionOptions } from '../decorators/subscription.decorator';
import { AbstractGraphQLDriver } from '../drivers/abstract-graphql.driver';
import { GqlParamtype } from '../enums/gql-paramtype.enum';
import { Resolver } from '../enums/resolver.enum';
import { GqlParamsFactory } from '../factories/params.factory';
import {
  FIELD_RESOLVER_MIDDLEWARE_METADATA,
  FIELD_TYPENAME,
  GRAPHQL_MODULE_OPTIONS,
  PARAM_ARGS_METADATA,
  SUBSCRIPTION_OPTIONS_METADATA,
  SUBSCRIPTION_TYPE,
} from '../graphql.constants';
import { GqlModuleOptions } from '../interfaces';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';
import { getNumberOfArguments } from '../utils';
import { decorateFieldResolverWithMiddleware } from '../utils/decorate-field-resolver.util';
import { extractMetadata } from '../utils/extract-metadata.util';
import { BaseExplorerService } from './base-explorer.service';
import { GqlContextType } from './gql-execution-context';

// TODO remove in the next version (backward-compatibility layer)
// "ContextIdFactory.getByRequest.length" returns an incorrent number
// as parameters with default values do not count in.
// @ref https://github.com/nestjs/graphql/pull/2214
const getByRequestNumberOfArguments = getNumberOfArguments(
  ContextIdFactory.getByRequest,
);

@Injectable()
export class ResolversExplorerService extends BaseExplorerService {
  private readonly logger = new Logger(ResolversExplorerService.name);
  private readonly gqlParamsFactory = new GqlParamsFactory();
  private readonly injector = new Injector();

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly metadataScanner: MetadataScanner,
    private readonly externalContextCreator: ExternalContextCreator,
    @Inject(GRAPHQL_MODULE_OPTIONS)
    private readonly gqlOptions: GqlModuleOptions,
    private readonly moduleRef: ModuleRef,
  ) {
    super();
  }

  explore() {
    const modules = this.getModules(
      this.modulesContainer,
      this.gqlOptions.include || [],
    );
    const gqlAdapter = this.moduleRef.get(AbstractGraphQLDriver);
    const resolvers = this.flatMap(modules, (instance, moduleRef) =>
      this.filterResolvers(gqlAdapter, instance, moduleRef),
    );
    return this.groupMetadata(resolvers);
  }

  filterResolvers(
    gqlAdapter: AbstractGraphQLDriver,
    wrapper: InstanceWrapper,
    moduleRef: Module,
  ): ResolverMetadata[] {
    const { instance } = wrapper;
    if (!instance) {
      return undefined;
    }
    const prototype = Object.getPrototypeOf(instance);
    const predicate = (
      resolverType: string,
      isReferenceResolver: boolean,
      isPropertyResolver: boolean,
    ) =>
      isUndefined(resolverType) ||
      (!isReferenceResolver &&
        !isPropertyResolver &&
        ![Resolver.MUTATION, Resolver.QUERY, Resolver.SUBSCRIPTION].some(
          (type) => type === resolverType,
        ));

    const resolvers = this.metadataScanner.scanFromPrototype(
      instance,
      prototype,
      (name) => extractMetadata(instance, prototype, name, predicate),
    );

    const isRequestScoped = !wrapper.isDependencyTreeStatic();
    return resolvers
      .filter((resolver) => !!resolver)
      .map((resolver) => {
        const createContext = (transform?: Function) =>
          this.createContextCallback(
            instance,
            prototype,
            wrapper,
            moduleRef,
            resolver,
            isRequestScoped,
            transform,
          );
        if (resolver.type === SUBSCRIPTION_TYPE) {
          if (!wrapper.isDependencyTreeStatic()) {
            // Note: We don't throw an exception here for backward
            // compatibility reasons.
            this.logger.error(
              `"${wrapper.metatype.name}" resolver is request or transient-scoped. Resolvers that register subscriptions with the "@Subscription()" decorator must be static (singleton).`,
            );
          }
          const subscriptionOptions = Reflect.getMetadata(
            SUBSCRIPTION_OPTIONS_METADATA,
            instance[resolver.methodName],
          );
          return this.createSubscriptionMetadata(
            gqlAdapter,
            createContext,
            subscriptionOptions,
            resolver,
            instance,
          );
        }
        return {
          ...resolver,
          callback: createContext(),
        };
      });
  }

  createContextCallback<T extends Record<string, any>>(
    instance: T,
    prototype: any,
    wrapper: InstanceWrapper,
    moduleRef: Module,
    resolver: ResolverMetadata,
    isRequestScoped: boolean,
    transform: Function = identity,
  ) {
    const paramsFactory = this.gqlParamsFactory;
    const isPropertyResolver = ![
      Resolver.MUTATION,
      Resolver.QUERY,
      Resolver.SUBSCRIPTION,
    ].some((type) => type === resolver.type);

    const fieldResolverEnhancers = this.gqlOptions.fieldResolverEnhancers || [];
    const contextOptions =
      resolver.methodName === FIELD_TYPENAME
        ? { guards: false, filters: false, interceptors: false }
        : isPropertyResolver
        ? {
            guards: fieldResolverEnhancers.includes('guards'),
            filters: fieldResolverEnhancers.includes('filters'),
            interceptors: fieldResolverEnhancers.includes('interceptors'),
          }
        : undefined;

    if (isRequestScoped) {
      const resolverCallback = async (...args: any[]) => {
        const gqlContext = paramsFactory.exchangeKeyForValue(
          GqlParamtype.CONTEXT,
          undefined,
          args,
        );
        const contextId = this.getContextId(gqlContext);
        this.registerContextProvider(gqlContext, contextId);
        const contextInstance = await this.injector.loadPerContext(
          instance,
          moduleRef,
          moduleRef.providers,
          contextId,
        );
        const callback = this.externalContextCreator.create(
          contextInstance,
          transform(contextInstance[resolver.methodName]),
          resolver.methodName,
          PARAM_ARGS_METADATA,
          paramsFactory,
          contextId,
          wrapper.id,
          contextOptions,
          'graphql',
        );
        return callback(...args);
      };
      return isPropertyResolver
        ? this.registerFieldMiddlewareIfExists(
            resolverCallback,
            instance,
            resolver.methodName,
          )
        : resolverCallback;
    }
    const resolverCallback = this.externalContextCreator.create<
      Record<number, ParamMetadata>,
      GqlContextType
    >(
      instance,
      prototype[resolver.methodName],
      resolver.methodName,
      PARAM_ARGS_METADATA,
      paramsFactory,
      undefined,
      undefined,
      contextOptions,
      'graphql',
    );

    return isPropertyResolver
      ? this.registerFieldMiddlewareIfExists(
          resolverCallback,
          instance,
          resolver.methodName,
        )
      : resolverCallback;
  }

  createSubscriptionMetadata(
    gqlAdapter: AbstractGraphQLDriver,
    createSubscribeContext: Function,
    subscriptionOptions: SubscriptionOptions,
    resolverMetadata: ResolverMetadata,
    instanceRef: Record<string, any>,
  ) {
    const resolveFunc =
      subscriptionOptions &&
      subscriptionOptions.resolve &&
      subscriptionOptions.resolve.bind(instanceRef);
    const baseCallbackMetadata = {
      resolve: resolveFunc,
    };
    if (subscriptionOptions && subscriptionOptions.filter) {
      return {
        ...resolverMetadata,
        callback: {
          ...baseCallbackMetadata,
          subscribe: gqlAdapter.subscriptionWithFilter(
            instanceRef,
            subscriptionOptions.filter,
            createSubscribeContext,
          ),
        },
      };
    }
    return {
      ...resolverMetadata,
      callback: {
        ...baseCallbackMetadata,
        subscribe: createSubscribeContext(),
      },
    };
  }

  getAllCtors(): Function[] {
    const modules = this.getModules(
      this.modulesContainer,
      this.gqlOptions.include || [],
    );
    const resolvers = this.flatMap(modules, this.mapToCtor).filter(Boolean);
    return resolvers;
  }

  private mapToCtor(wrapper: InstanceWrapper): Function {
    const { instance } = wrapper;
    if (!instance) {
      return undefined;
    }
    return instance.constructor;
  }

  private registerContextProvider<T = any>(request: T, contextId: ContextId) {
    const coreModuleArray = [...this.modulesContainer.entries()]
      .filter(
        ([key, { metatype }]) =>
          metatype && metatype.name === InternalCoreModule.name,
      )
      .map(([key, value]) => value);

    const coreModuleRef = head(coreModuleArray);
    if (!coreModuleRef) {
      return;
    }
    const wrapper = coreModuleRef.getProviderByKey(REQUEST);
    wrapper.setInstanceByContextId(contextId, {
      instance: request,
      isResolved: true,
    });
  }

  private registerFieldMiddlewareIfExists<
    TSource extends object = any,
    TContext = {},
    TArgs = { [argName: string]: any },
    TOutput = any,
  >(resolverFn: Function, instance: object, methodKey: string) {
    const fieldMiddleware = Reflect.getMetadata(
      FIELD_RESOLVER_MIDDLEWARE_METADATA,
      instance[methodKey],
    );

    const middlewareFunctions = (
      this.gqlOptions?.buildSchemaOptions?.fieldMiddleware || []
    ).concat(fieldMiddleware || []);

    if (middlewareFunctions?.length === 0) {
      return resolverFn;
    }

    const originalResolveFnFactory =
      (...args: [TSource, TArgs, TContext, GraphQLResolveInfo]) =>
      () =>
        resolverFn(...args);

    return decorateFieldResolverWithMiddleware<
      TSource,
      TContext,
      TArgs,
      TOutput
    >(originalResolveFnFactory, middlewareFunctions);
  }

  private getContextId(gqlContext: Record<string | symbol, any>): ContextId {
    if (getByRequestNumberOfArguments === 2) {
      const contextId = ContextIdFactory.getByRequest(gqlContext, ['req']);
      if (!gqlContext[REQUEST_CONTEXT_ID as any]) {
        Object.defineProperty(gqlContext, REQUEST_CONTEXT_ID, {
          value: contextId,
          enumerable: false,
          configurable: false,
          writable: false,
        });
      }
      return contextId;
    } else {
      // TODO remove in the next version (backward-compatibility layer)
      // Left for backward compatibility purposes
      let contextId: ContextId;

      if (gqlContext && gqlContext[REQUEST_CONTEXT_ID]) {
        contextId = gqlContext[REQUEST_CONTEXT_ID];
      } else if (
        gqlContext &&
        gqlContext.req &&
        gqlContext.req[REQUEST_CONTEXT_ID]
      ) {
        contextId = gqlContext.req[REQUEST_CONTEXT_ID];
      } else {
        contextId = createContextId();
        Object.defineProperty(gqlContext, REQUEST_CONTEXT_ID, {
          value: contextId,
          enumerable: false,
          configurable: false,
          writable: false,
        });
      }

      return contextId;
    }
  }
}
