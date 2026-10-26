import { Inject, Injectable, Logger, Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils.js';
import {
  ContextIdFactory,
  MetadataScanner,
  ModuleRef,
  ModulesContainer,
  REQUEST,
} from '@nestjs/core';
import type { ExternalExceptionFilterContext } from '@nestjs/core/exceptions/external-exception-filter-context.js';
import type { ExternalExceptionsHandler } from '@nestjs/core/exceptions/external-exceptions-handler.js';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host.js';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator.js';
import { ParamMetadata } from '@nestjs/core/helpers/interfaces/params-metadata.interface.js';
import {
  CONTROLLER_ID_KEY,
  STATIC_CONTEXT,
} from '@nestjs/core/injector/constants.js';
import { Injector } from '@nestjs/core/injector/injector.js';
import {
  ContextId,
  InstanceWrapper,
} from '@nestjs/core/injector/instance-wrapper.js';
import { InternalCoreModule } from '@nestjs/core/injector/internal-core-module/index.js';
import { Module } from '@nestjs/core/injector/module.js';
import { Entrypoint } from '@nestjs/core/inspector/interfaces/entrypoint.interface.js';
import { SerializedGraph } from '@nestjs/core/inspector/serialized-graph.js';
import { REQUEST_CONTEXT_ID } from '@nestjs/core/router/request/request-constants.js';
import { identity } from 'es-toolkit';
import { GraphQLResolveInfo } from 'graphql';
import { SubscriptionOptions } from '../decorators/subscription.decorator.js';
import { getUseFieldMiddleware } from '../decorators/use-field-middleware.decorator.js';
import { AbstractGraphQLDriver } from '../drivers/abstract-graphql.driver.js';
import { GqlParamtype } from '../enums/gql-paramtype.enum.js';
import { Resolver } from '../enums/resolver.enum.js';
import { GqlParamsFactory } from '../factories/params.factory.js';
import {
  FIELD_RESOLVER_MIDDLEWARE_METADATA,
  FIELD_TYPENAME,
  GRAPHQL_MODULE_OPTIONS,
  PARAM_ARGS_METADATA,
  SUBSCRIPTION_OPTIONS_METADATA,
  SUBSCRIPTION_TYPE,
} from '../graphql.constants.js';
import { FieldMiddleware, GqlModuleOptions } from '../interfaces/index.js';
import { GqlEntrypointMetadata } from '../interfaces/gql-entrypoint-metadata.interface.js';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface.js';
import { decorateFieldResolverWithMiddleware } from '../utils/decorate-field-resolver.util.js';
import { extractMetadata } from '../utils/extract-metadata.util.js';
import { createArgsMapper } from '../utils/map-args-to-props.util.js';
import { normalizeResolverArgs } from '../utils/normalize-resolver-args.js';
import { BaseExplorerService } from './base-explorer.service.js';
import { GqlContextType } from './gql-execution-context.js';
import { ResolverDecoratorHost } from './resolver-decorator-host.js';

const ROOT_RESOLVER_TYPES = new Set<string>([
  Resolver.MUTATION,
  Resolver.QUERY,
  Resolver.SUBSCRIPTION,
]);

@Injectable()
export class ResolversExplorerService extends BaseExplorerService {
  private readonly logger = new Logger(ResolversExplorerService.name);
  private readonly gqlParamsFactory = new GqlParamsFactory();
  private readonly injector = new Injector();
  private coreModuleRef: Module | null | undefined;

  private fieldResolverEnhancersLookup: {
    guards: boolean;
    filters: boolean;
    interceptors: boolean;
  } | null = null;

  private hasGlobalFieldMiddleware: boolean | null = null;

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly metadataScanner: MetadataScanner,
    private readonly externalContextCreator: ExternalContextCreator,
    @Inject(GRAPHQL_MODULE_OPTIONS)
    private readonly gqlOptions: GqlModuleOptions,
    private readonly moduleRef: ModuleRef,
    private readonly serializedGraph: SerializedGraph,
    private readonly resolverDecoratorHost: ResolverDecoratorHost,
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
        !ROOT_RESOLVER_TYPES.has(resolverType));

    const resolvers = this.metadataScanner
      .getAllMethodNames(prototype)
      .map((name) => extractMetadata(instance, prototype, name, predicate))
      .filter((resolver) => !!resolver);

    const isRequestScoped = !wrapper.isDependencyTreeStatic();
    return resolvers.map((resolver) => {
      this.assignResolverConstructorUniqueId(instance.constructor, moduleRef);

      const entrypointDefinition: Entrypoint<GqlEntrypointMetadata> = {
        id: `${wrapper.id}_${resolver.methodName}`,
        type: 'graphql-entrypoint',
        methodName: resolver.methodName,
        className: wrapper.name,
        classNodeId: wrapper.id,
        metadata: {
          key: resolver.name,
          parentType: resolver.type,
        },
      };

      this.serializedGraph.insertEntrypoint(entrypointDefinition, wrapper.id);

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
    const isPropertyResolver = !ROOT_RESOLVER_TYPES.has(resolver.type);
    const mapArgs = createArgsMapper(instance.constructor, resolver.methodName);

    if (this.fieldResolverEnhancersLookup === null) {
      const enhancers = this.gqlOptions.fieldResolverEnhancers || [];
      this.fieldResolverEnhancersLookup = {
        guards: enhancers.includes('guards'),
        filters: enhancers.includes('filters'),
        interceptors: enhancers.includes('interceptors'),
      };
    }
    const contextOptions =
      resolver.methodName === FIELD_TYPENAME
        ? { guards: false, filters: false, interceptors: false }
        : isPropertyResolver
        ? this.fieldResolverEnhancersLookup
        : undefined;

    if (isRequestScoped) {
      const filtersEnabled = !contextOptions || contextOptions.filters;
      let creationErrorHandler: ExternalExceptionsHandler | null | undefined;

      const resolverCallback = async (...args: any[]) => {
        let contextInstance: T;
        try {
          const gqlContext = paramsFactory.exchangeKeyForValue(
            GqlParamtype.CONTEXT,
            undefined,
            args,
          );
          const contextId = this.getContextId(gqlContext);
          this.registerContextProvider(gqlContext, contextId);
          contextInstance = await this.injector.loadPerContext(
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
          return await callback(...args);
        } catch (err) {
          // Errors thrown by the handler pipeline were already routed
          // through the exception filters by the callback created above.
          if (contextInstance || !filtersEnabled) {
            throw err;
          }
          // Otherwise, the resolver (or one of its request-scoped
          // dependencies) could not be instantiated: route the error through
          // the filters bound to the resolver, like the HTTP router does.
          const handler = prototype[resolver.methodName];
          if (creationErrorHandler === undefined) {
            creationErrorHandler = this.createCreationErrorHandler(
              instance,
              handler,
              moduleRef,
              wrapper,
            );
          }
          if (!creationErrorHandler) {
            throw err;
          }
          const host = new ExecutionContextHost(
            args,
            instance.constructor as Type,
            handler,
          );
          host.setType('graphql');
          return creationErrorHandler.next(err, host);
        }
      };
      const wrappedCallback = this.withMappedArgs(resolverCallback, mapArgs);
      return isPropertyResolver
        ? this.registerFieldMiddlewareIfExists(
            wrappedCallback,
            instance,
            resolver.methodName,
          )
        : this.resolverDecoratorHost.decorate(wrappedCallback);
    }

    if (
      isPropertyResolver &&
      this.canUseFastFieldResolver(
        instance,
        resolver.methodName,
        contextOptions,
      )
    ) {
      const resolverFn = prototype[resolver.methodName];
      if (typeof resolverFn === 'function') {
        return resolverFn.bind(instance);
      }
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
    const wrappedCallback = this.withMappedArgs(resolverCallback, mapArgs);

    return isPropertyResolver
      ? this.registerFieldMiddlewareIfExists(
          wrappedCallback,
          instance,
          resolver.methodName,
        )
      : this.resolverDecoratorHost.decorate(wrappedCallback);
  }

  /**
   * Rewrites the incoming arguments object onto the property names declared by
   * the `@ArgsType()`/`@InputType()` classes of the method before the resolver
   * context (and therefore any pipe, global ones included) runs.
   */
  private withMappedArgs<T extends (...args: any[]) => any>(
    resolverFn: T,
    mapArgs: ((args: any) => any) | null,
  ): T {
    if (!mapArgs) {
      return resolverFn;
    }
    return ((...args: any[]) => {
      // Reference resolvers and "resolveType" callbacks receive no arguments
      // object, which is exactly what normalizeResolverArgs() detects.
      if (args.length < 2 || normalizeResolverArgs(args) !== args) {
        return resolverFn(...args);
      }
      const mappedArgs = mapArgs(args[1]);
      if (mappedArgs === args[1]) {
        return resolverFn(...args);
      }
      const nextArgs = [...args];
      nextArgs[1] = mappedArgs;
      return resolverFn(...nextArgs);
    }) as T;
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

  /**
   * Builds the exceptions handler for errors thrown while a request-scoped
   * resolver (or one of its dependencies) is being instantiated, which happens
   * before the filter-wrapped callback exists. Mirrors the HTTP router
   * (`RouterExplorer#createRequestScopedHandler` in `@nestjs/core`).
   *
   * `ExternalContextCreator` does not expose its exception filter context, so
   * it is reached through a private field. Returns `null` (the error is then
   * rethrown as is) if that field is missing or has an unexpected shape.
   */
  private createCreationErrorHandler(
    instance: object,
    handler: (...args: any[]) => any,
    moduleRef: Module,
    wrapper: InstanceWrapper,
  ): ExternalExceptionsHandler | null {
    const filtersContext: ExternalExceptionFilterContext | undefined =
      this.externalContextCreator['filtersContextCreator'];
    if (typeof filtersContext?.create !== 'function') {
      return null;
    }
    const exceptionsHandler = filtersContext.create(
      instance,
      handler,
      moduleRef.token,
      STATIC_CONTEXT,
      wrapper.id,
    );
    return typeof exceptionsHandler?.next === 'function'
      ? exceptionsHandler
      : null;
  }

  private registerContextProvider<T = any>(request: T, contextId: ContextId) {
    if (this.coreModuleRef === undefined) {
      let foundModule: Module | null = null;
      for (const [, moduleRef] of this.modulesContainer.entries()) {
        if (moduleRef.metatype?.name === InternalCoreModule.name) {
          foundModule = moduleRef;
          break;
        }
      }
      this.coreModuleRef = foundModule;
    }

    if (!this.coreModuleRef) {
      return;
    }

    const wrapper = this.coreModuleRef.getProviderByKey(REQUEST);
    wrapper.setInstanceByContextId(contextId, {
      instance: contextId.getParent ? contextId.payload : request,
      isResolved: true,
    });
  }

  private registerFieldMiddlewareIfExists<
    TSource extends object = any,
    TContext = {},
    TArgs = { [argName: string]: any },
    TOutput = any,
  >(resolverFn: Function, instance: object, methodKey: string) {
    const middlewareFunctions = (
      this.gqlOptions?.buildSchemaOptions?.fieldMiddleware || []
    ).concat(this.getFieldResolverMiddleware(instance, methodKey));

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

  /**
   * Middleware of a field resolver method: the `middleware` option of
   * `@ResolveField()` followed by the middleware applied with `@UseFieldMiddleware()`.
   */
  private getFieldResolverMiddleware(
    instance: object,
    methodKey: string,
  ): FieldMiddleware[] {
    const optionMiddleware: FieldMiddleware[] | undefined = Reflect.getMetadata(
      FIELD_RESOLVER_MIDDLEWARE_METADATA,
      instance[methodKey as keyof typeof instance],
    );
    return (optionMiddleware ?? []).concat(
      getUseFieldMiddleware(instance, methodKey),
    );
  }

  private getContextId(gqlContext: Record<string | symbol, any>): ContextId {
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
  }

  /**
   * Determines if a field resolver can use the fast-path that bypasses
   * ExternalContextCreator overhead. This is possible when:
   * - No guards/filters/interceptors are enabled for field resolvers
   * - No field middleware is registered (global or method-level)
   * - No parameter decorators (@Parent, @Args, etc.) are used on the method
   */
  private canUseFastFieldResolver(
    instance: object,
    methodKey: string,
    contextOptions?: {
      guards: boolean;
      filters: boolean;
      interceptors: boolean;
    },
  ): boolean {
    if (
      contextOptions?.guards ||
      contextOptions?.filters ||
      contextOptions?.interceptors
    ) {
      return false;
    }

    if (this.getFieldResolverMiddleware(instance, methodKey).length > 0) {
      return false;
    }

    if (this.hasGlobalFieldMiddleware === null) {
      const globalMiddleware =
        this.gqlOptions?.buildSchemaOptions?.fieldMiddleware;
      this.hasGlobalFieldMiddleware = (globalMiddleware?.length ?? 0) > 0;
    }
    if (this.hasGlobalFieldMiddleware) {
      return false;
    }

    const paramMetadata = Reflect.getMetadata(
      PARAM_ARGS_METADATA,
      instance.constructor,
      methodKey,
    );
    if (paramMetadata && Object.keys(paramMetadata).length > 0) {
      return false;
    }

    return true;
  }

  private assignResolverConstructorUniqueId(
    resolverConstructor: any,
    moduleRef: Module,
  ) {
    // eslint-disable-next-line no-prototype-builtins
    if (resolverConstructor.hasOwnProperty(CONTROLLER_ID_KEY)) {
      return;
    }

    moduleRef.assignControllerUniqueId(resolverConstructor);
  }
}
