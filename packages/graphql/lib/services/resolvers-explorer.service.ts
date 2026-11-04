import { Inject, Injectable, Logger, Type } from '@nestjs/common';
import {
  EXCEPTION_FILTERS_METADATA,
  GUARDS_METADATA,
  INTERCEPTORS_METADATA,
  PIPES_METADATA,
} from '@nestjs/common/constants.js';
import { isFunction, isUndefined } from '@nestjs/common/utils/shared.utils.js';
import {
  ApplicationConfig,
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
import { identity } from 'es-toolkit';
import { GraphQLError, GraphQLResolveInfo } from 'graphql';
import { SubscriptionOptions } from '../decorators/subscription.decorator.js';
import { getUseFieldMiddleware } from '../decorators/use-field-middleware.decorator.js';
import { AbstractGraphQLDriver } from '../drivers/abstract-graphql.driver.js';
import { GqlParamtype } from '../enums/gql-paramtype.enum.js';
import { Resolver } from '../enums/resolver.enum.js';
import { GqlParamsFactory } from '../factories/params.factory.js';
import {
  FIELD_RESOLVER_COMPOSITION_METADATA,
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
import {
  ExtractedResolverMetadata,
  extractMetadata,
} from '../utils/extract-metadata.util.js';
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

const isObjectLike = (value: unknown): value is object =>
  typeof value === 'object' && value !== null;

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
      true,
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
      isTypeReference: boolean,
    ) =>
      isUndefined(resolverType) ||
      (!isReferenceResolver &&
        !isPropertyResolver &&
        (isTypeReference || !ROOT_RESOLVER_TYPES.has(resolverType)));

    const resolvers = this.metadataScanner
      .getAllMethodNames(prototype)
      .map((name) => extractMetadata(instance, prototype, name, predicate))
      .filter((resolver) => !!resolver);

    // An alias ("useExisting") exposes the instance of the provider it points
    // to, which is checked on its own
    if (resolvers.length > 0 && !wrapper.isAlias) {
      this.assertEnhancersCanRun(
        instance,
        prototype,
        wrapper,
        moduleRef,
        resolvers,
      );
    }

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
      if (this.isSubscriptionHandler(resolver)) {
        if (!wrapper.isDependencyTreeStatic()) {
          // Note: We don't throw an exception here for backward
          // compatibility reasons.
          this.logger.error(
            `"${wrapper.metatype.name}" resolver is request or transient-scoped. Resolvers that register subscriptions with the "@Subscription()" decorator must be static (singleton).`,
          );
        }
        const subscriptionOptions = Reflect.getMetadata(
          SUBSCRIPTION_OPTIONS_METADATA,
          prototype[resolver.methodName],
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
    const isPropertyResolver = !this.isRootTypeHandler(resolver);
    const mapArgs = createArgsMapper(instance.constructor, resolver.methodName);
    const contextOptions = this.getContextOptions(resolver);

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
          // The decorated method, not the instance property: the resolver
          // may have rebound it (e.g., in its constructor), which loses its
          // metadata (guards, pipes, ...)
          const callback = this.externalContextCreator.create(
            contextInstance,
            transform(prototype[resolver.methodName]),
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
    // "filter" and "resolve" receive the arguments keyed the way the handler
    // receives them (see "createContextCallback()"). The schema-named keys
    // are kept as well, so that callbacks written against them keep working.
    const mapArgs = createArgsMapper(
      instanceRef.constructor,
      resolverMetadata.methodName,
      { keepSchemaNames: true },
    );
    // "resolve" becomes the resolver of the subscription field. graphql-js
    // "execute()" calls it for a subscription operation sent as a plain
    // request (e.g., an HTTP POST) without ever calling "subscribe", so
    // without the guards (and other enhancers) of the handler. The events of
    // a subscription are resolved with the context passed to "subscribe":
    // only resolve those of an operation whose "subscribe" completed.
    const subscribedContexts = new WeakSet<object>();
    const createTrackedSubscribeContext = () => {
      const subscribe = createSubscribeContext();
      return async (...args: unknown[]) => {
        const eventStream = await subscribe(...args);
        if (isObjectLike(args[2])) {
          subscribedContexts.add(args[2]);
        }
        return eventStream;
      };
    };
    const resolve = subscriptionOptions?.resolve;
    const resolveFunc =
      resolve &&
      ((payload: unknown, args: unknown, context: unknown, info: unknown) => {
        if (!isObjectLike(context) || !subscribedContexts.has(context)) {
          throw new GraphQLError(
            `"${resolverMetadata.name}" can only be resolved for the events of an active subscription.`,
            { extensions: { code: 'BAD_REQUEST' } },
          );
        }
        return resolve.call(
          instanceRef,
          payload,
          mapArgs ? mapArgs(args) : args,
          context,
          info,
        );
      });
    const baseCallbackMetadata = {
      resolve: resolveFunc,
    };
    if (subscriptionOptions && subscriptionOptions.filter) {
      const filter = subscriptionOptions.filter;
      return {
        ...resolverMetadata,
        callback: {
          ...baseCallbackMetadata,
          subscribe: gqlAdapter.subscriptionWithFilter(
            instanceRef,
            mapArgs
              ? function (this: unknown, payload, variables, context) {
                  return filter.call(
                    this,
                    payload,
                    mapArgs(variables),
                    context,
                  );
                }
              : filter,
            createTrackedSubscribeContext,
          ),
        },
      };
    }
    return {
      ...resolverMetadata,
      callback: {
        ...baseCallbackMetadata,
        subscribe: createTrackedSubscribeContext(),
      },
    };
  }

  getAllCtors(): Function[] {
    const modules = this.getModules(
      this.modulesContainer,
      this.gqlOptions.include || [],
      true,
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
    const fieldMiddleware = this.getFieldResolverMiddleware(
      instance,
      methodKey,
    );
    const middlewareFunctions = (
      this.gqlOptions?.buildSchemaOptions?.fieldMiddleware || []
    ).concat(fieldMiddleware);

    if (middlewareFunctions?.length === 0) {
      return resolverFn;
    }

    const originalResolveFnFactory =
      (...args: [TSource, TArgs, TContext, GraphQLResolveInfo]) =>
      () =>
        resolverFn(...args);

    const decorated = decorateFieldResolverWithMiddleware<
      TSource,
      TContext,
      TArgs,
      TOutput
    >(originalResolveFnFactory, middlewareFunctions);
    // Lets the middleware of the model field run between the global
    // middleware and the handler's own (see "withModelFieldMiddleware()")
    Reflect.defineMetadata(
      FIELD_RESOLVER_COMPOSITION_METADATA,
      { resolve: resolverFn, middleware: fieldMiddleware },
      decorated,
    );
    return decorated;
  }

  /**
   * Middleware of a field resolver method: the `middleware` option of
   * `@ResolveField()` followed by the middleware applied with `@UseFieldMiddleware()`.
   */
  private getFieldResolverMiddleware(
    instance: object,
    methodKey: string,
  ): FieldMiddleware[] {
    // The decorated method (see "createContextCallback()")
    const handler =
      Object.getPrototypeOf(instance)?.[methodKey] ??
      instance[methodKey as keyof typeof instance];
    const optionMiddleware: FieldMiddleware[] | undefined = Reflect.getMetadata(
      FIELD_RESOLVER_MIDDLEWARE_METADATA,
      handler,
    );
    return (optionMiddleware ?? []).concat(
      getUseFieldMiddleware(instance, methodKey),
    );
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

  /**
   * Whether the handler resolves a field of a root operation type rather than
   * one of an object or interface type. The name of the type is not enough to
   * tell: a code first object type can be named like a root type (e.g., a
   * billing "Subscription"), and its resolver then declares it with a class.
   */
  private isRootTypeHandler(
    resolver: ResolverMetadata | ExtractedResolverMetadata,
  ): boolean {
    return (
      ROOT_RESOLVER_TYPES.has(resolver.type) &&
      !(resolver as ExtractedResolverMetadata).isTypeReference
    );
  }

  /**
   * A "@Subscription()" handler or, in a schema first resolver of the
   * "Subscription" type, any handler.
   */
  private isSubscriptionHandler(resolver: ResolverMetadata): boolean {
    return (
      resolver.type === SUBSCRIPTION_TYPE && this.isRootTypeHandler(resolver)
    );
  }

  private getContextOptions(resolver: ResolverMetadata) {
    if (this.fieldResolverEnhancersLookup === null) {
      const enhancers = this.gqlOptions.fieldResolverEnhancers || [];
      this.fieldResolverEnhancersLookup = {
        guards: enhancers.includes('guards'),
        filters: enhancers.includes('filters'),
        interceptors: enhancers.includes('interceptors'),
      };
    }
    if (resolver.methodName === FIELD_TYPENAME) {
      return { guards: false, filters: false, interceptors: false };
    }
    if (this.isRootTypeHandler(resolver)) {
      return undefined;
    }
    // The field resolvers of an object type named like a root type used to
    // be bound as root handlers: keep all the enhancers on for them, so that
    // a guard declared there keeps running, whatever "fieldResolverEnhancers"
    return ROOT_RESOLVER_TYPES.has(resolver.type)
      ? { guards: true, filters: true, interceptors: true }
      : this.fieldResolverEnhancersLookup;
  }

  /**
   * `ExternalContextCreator` silently leaves out an enhancer it cannot
   * resolve, so a handler would run without guards, interceptors, pipes or
   * filters it declares. Fail at startup instead when:
   * - an enhancer is referenced by class, but Nest did not register it for
   *   the provider: it does so when scanning a module, only for providers
   *   declared as a class (directly or through `useClass`), and not for those
   *   created with `useFactory` or `useValue`;
   * - a request or transient-scoped global enhancer applies, but the provider
   *   is not an entry provider, the only ones Nest binds those enhancers to.
   *   A provider is one when the class, the token or the `useClass` class of
   *   the provider is decorated with `@Resolver()`.
   */
  private assertEnhancersCanRun(
    instance: object,
    prototype: any,
    wrapper: InstanceWrapper,
    moduleRef: Module,
    resolvers: ResolverMetadata[],
  ) {
    const providerName = String(wrapper.name);
    const className = instance.constructor.name;
    const enabledKeys = new Set<string>();

    for (const resolver of resolvers) {
      const { methodName } = resolver;
      const contextOptions = this.getContextOptions(resolver);
      const params: { pipes?: unknown[] }[] = Object.values(
        Reflect.getMetadata(
          PARAM_ARGS_METADATA,
          instance.constructor,
          methodName,
        ) ?? {},
      );
      // The kinds of enhancers that run for the handler
      const keys = [
        (!contextOptions || contextOptions.guards) && GUARDS_METADATA,
        (!contextOptions || contextOptions.interceptors) &&
          INTERCEPTORS_METADATA,
        (!contextOptions || contextOptions.filters) &&
          EXCEPTION_FILTERS_METADATA,
        params.length > 0 && PIPES_METADATA,
      ].filter(Boolean) as string[];

      const enhancers: unknown[] = keys
        .flatMap((key) => {
          enabledKeys.add(key);
          return [
            ...(Reflect.getMetadata(key, instance.constructor) ?? []),
            ...(Reflect.getMetadata(key, prototype[methodName]) ?? []),
          ];
        })
        .concat(params.flatMap((param) => param.pipes ?? []));

      const unresolved = enhancers.filter(
        (enhancer) =>
          isFunction(enhancer) &&
          !this.isEnhancerBound(enhancer as Type, wrapper, moduleRef),
      ) as Type[];
      if (unresolved.length > 0) {
        const names = [...new Set(unresolved.map(({ name }) => `"${name}"`))];
        throw new Error(
          `The "${className}.${methodName}" GraphQL handler of the "${providerName}" provider references ${names.join(
            ', ',
          )} by class, but Nest did not register ${
            names.length > 1 ? 'these enhancers' : 'this enhancer'
          } for the provider, so ${
            names.length > 1 ? 'they' : 'it'
          } would never run. ` +
            `Nest registers the enhancers referenced by class only for providers declared as a class: register the resolver as "${className}" or with "useClass: ${className}" instead of "useFactory" or "useValue", or pass enhancer instances instead of classes.`,
        );
      }
    }

    const isEntryProvider = moduleRef.entryProviders.includes(wrapper);
    if (isEntryProvider) {
      return;
    }
    const config = this.moduleRef.get(ApplicationConfig, { strict: false });
    const [scopedEnhancer] = [
      ...(enabledKeys.has(GUARDS_METADATA)
        ? config.getGlobalRequestGuards()
        : []),
      ...(enabledKeys.has(INTERCEPTORS_METADATA)
        ? config.getGlobalRequestInterceptors()
        : []),
      ...(enabledKeys.has(PIPES_METADATA)
        ? config.getGlobalRequestPipes()
        : []),
      ...(enabledKeys.has(EXCEPTION_FILTERS_METADATA)
        ? config.getGlobalRequestFilters()
        : []),
    ];
    if (scopedEnhancer) {
      throw new Error(
        `The "${providerName}" provider of the "${
          moduleRef.name
        }" module hosts GraphQL handlers but is not an entry provider, so the request or transient-scoped global enhancer "${
          scopedEnhancer.metatype?.name ?? scopedEnhancer.name
        }" would not run for them. ` +
          `Decorate the "${className}" class with "@Resolver()" and register it in the "providers" of the module as "${className}", with "useClass: ${className}", or with "${className}" as the token.`,
      );
    }
  }

  /**
   * Whether `ExternalContextCreator` finds an instance of the enhancer for a
   * handler of the provider: it looks it up in the module of the provider,
   * where Nest registered it either for this provider (and so created the
   * instances it needs, whatever its scope) or, if it is static, for another
   * provider of the module.
   */
  private isEnhancerBound(
    enhancer: Type,
    wrapper: InstanceWrapper,
    moduleRef: Module,
  ): boolean {
    const enhancerWrapper = moduleRef.injectables.get(enhancer);
    if (!enhancerWrapper) {
      return false;
    }
    return (
      !!wrapper.getEnhancersMetadata()?.includes(enhancerWrapper) ||
      (enhancerWrapper.isDependencyTreeStatic() && !enhancerWrapper.isTransient)
    );
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
