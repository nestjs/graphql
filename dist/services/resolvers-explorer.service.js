"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolversExplorerService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const core_1 = require("@nestjs/core");
const context_id_factory_1 = require("@nestjs/core/helpers/context-id-factory");
const external_context_creator_1 = require("@nestjs/core/helpers/external-context-creator");
const injector_1 = require("@nestjs/core/injector/injector");
const internal_core_module_1 = require("@nestjs/core/injector/internal-core-module");
const modules_container_1 = require("@nestjs/core/injector/modules-container");
const metadata_scanner_1 = require("@nestjs/core/metadata-scanner");
const request_constants_1 = require("@nestjs/core/router/request/request-constants");
const lodash_1 = require("lodash");
const gql_paramtype_enum_1 = require("../enums/gql-paramtype.enum");
const resolver_enum_1 = require("../enums/resolver.enum");
const params_factory_1 = require("../factories/params.factory");
const graphql_constants_1 = require("../graphql.constants");
const async_iterator_util_1 = require("../utils/async-iterator.util");
const extract_metadata_util_1 = require("../utils/extract-metadata.util");
const base_explorer_service_1 = require("./base-explorer.service");
let ResolversExplorerService = (() => {
    let ResolversExplorerService = class ResolversExplorerService extends base_explorer_service_1.BaseExplorerService {
        constructor(modulesContainer, metadataScanner, externalContextCreator, gqlOptions) {
            super();
            this.modulesContainer = modulesContainer;
            this.metadataScanner = metadataScanner;
            this.externalContextCreator = externalContextCreator;
            this.gqlOptions = gqlOptions;
            this.gqlParamsFactory = new params_factory_1.GqlParamsFactory();
            this.injector = new injector_1.Injector();
        }
        explore() {
            const modules = this.getModules(this.modulesContainer, this.gqlOptions.include || []);
            const resolvers = this.flatMap(modules, (instance, moduleRef) => this.filterResolvers(instance, moduleRef));
            return this.groupMetadata(resolvers);
        }
        filterResolvers(wrapper, moduleRef) {
            const { instance } = wrapper;
            if (!instance) {
                return undefined;
            }
            const prototype = Object.getPrototypeOf(instance);
            const predicate = (resolverType, isReferenceResolver, isPropertyResolver) => shared_utils_1.isUndefined(resolverType) ||
                (!isReferenceResolver &&
                    !isPropertyResolver &&
                    ![resolver_enum_1.Resolver.MUTATION, resolver_enum_1.Resolver.QUERY, resolver_enum_1.Resolver.SUBSCRIPTION].some((type) => type === resolverType));
            const resolvers = this.metadataScanner.scanFromPrototype(instance, prototype, (name) => extract_metadata_util_1.extractMetadata(instance, prototype, name, predicate));
            const isRequestScoped = !wrapper.isDependencyTreeStatic();
            return resolvers
                .filter((resolver) => !!resolver)
                .map((resolver) => {
                const createContext = (transform) => this.createContextCallback(instance, prototype, wrapper, moduleRef, resolver, isRequestScoped, transform);
                if (resolver.type === graphql_constants_1.SUBSCRIPTION_TYPE) {
                    const subscriptionOptions = Reflect.getMetadata(graphql_constants_1.SUBSCRIPTION_OPTIONS_METADATA, instance[resolver.methodName]);
                    return this.createSubscriptionMetadata(createContext, subscriptionOptions, resolver, instance);
                }
                return Object.assign(Object.assign({}, resolver), { callback: createContext() });
            });
        }
        createContextCallback(instance, prototype, wrapper, moduleRef, resolver, isRequestScoped, transform = lodash_1.identity) {
            const paramsFactory = this.gqlParamsFactory;
            const isPropertyResolver = ![
                resolver_enum_1.Resolver.MUTATION,
                resolver_enum_1.Resolver.QUERY,
                resolver_enum_1.Resolver.SUBSCRIPTION,
            ].some((type) => type === resolver.type);
            const fieldResolverEnhancers = this.gqlOptions.fieldResolverEnhancers || [];
            const contextOptions = isPropertyResolver
                ? {
                    guards: fieldResolverEnhancers.includes('guards'),
                    filters: fieldResolverEnhancers.includes('filters'),
                    interceptors: fieldResolverEnhancers.includes('interceptors'),
                }
                : undefined;
            if (isRequestScoped) {
                const resolverCallback = (...args) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const gqlContext = paramsFactory.exchangeKeyForValue(gql_paramtype_enum_1.GqlParamtype.CONTEXT, undefined, args);
                    let contextId;
                    if (gqlContext && gqlContext[request_constants_1.REQUEST_CONTEXT_ID]) {
                        contextId = gqlContext[request_constants_1.REQUEST_CONTEXT_ID];
                    }
                    else if (gqlContext &&
                        gqlContext.req &&
                        gqlContext.req[request_constants_1.REQUEST_CONTEXT_ID]) {
                        contextId = gqlContext.req[request_constants_1.REQUEST_CONTEXT_ID];
                    }
                    else {
                        contextId = context_id_factory_1.createContextId();
                        Object.defineProperty(gqlContext, request_constants_1.REQUEST_CONTEXT_ID, {
                            value: contextId,
                            enumerable: false,
                            configurable: false,
                            writable: false,
                        });
                    }
                    this.registerContextProvider(gqlContext, contextId);
                    const contextInstance = yield this.injector.loadPerContext(instance, moduleRef, moduleRef.providers, contextId);
                    const callback = this.externalContextCreator.create(contextInstance, transform(contextInstance[resolver.methodName]), resolver.methodName, graphql_constants_1.PARAM_ARGS_METADATA, paramsFactory, contextId, wrapper.id, contextOptions, 'graphql');
                    return callback(...args);
                });
                return resolverCallback;
            }
            const resolverCallback = this.externalContextCreator.create(instance, prototype[resolver.methodName], resolver.methodName, graphql_constants_1.PARAM_ARGS_METADATA, paramsFactory, undefined, undefined, contextOptions, 'graphql');
            return resolverCallback;
        }
        createSubscriptionMetadata(createSubscribeContext, subscriptionOptions, resolverMetadata, instanceRef) {
            const resolveFunc = subscriptionOptions &&
                subscriptionOptions.resolve &&
                subscriptionOptions.resolve.bind(instanceRef);
            const baseCallbackMetadata = {
                resolve: resolveFunc,
            };
            if (subscriptionOptions && subscriptionOptions.filter) {
                return Object.assign(Object.assign({}, resolverMetadata), { callback: Object.assign(Object.assign({}, baseCallbackMetadata), { subscribe: (...args) => async_iterator_util_1.createAsyncIterator(createSubscribeContext()(...args), (payload) => subscriptionOptions.filter.call(instanceRef, payload, ...args.slice(1))) }) });
            }
            return Object.assign(Object.assign({}, resolverMetadata), { callback: Object.assign(Object.assign({}, baseCallbackMetadata), { subscribe: createSubscribeContext() }) });
        }
        getAllCtors() {
            const modules = this.getModules(this.modulesContainer, this.gqlOptions.include || []);
            const resolvers = this.flatMap(modules, (instance) => instance.metatype);
            return resolvers;
        }
        registerContextProvider(request, contextId) {
            const coreModuleArray = [...this.modulesContainer.entries()]
                .filter(([key, { metatype }]) => metatype && metatype.name === internal_core_module_1.InternalCoreModule.name)
                .map(([key, value]) => value);
            const coreModuleRef = lodash_1.head(coreModuleArray);
            if (!coreModuleRef) {
                return;
            }
            const wrapper = coreModuleRef.getProviderByKey(core_1.REQUEST);
            wrapper.setInstanceByContextId(contextId, {
                instance: request,
                isResolved: true,
            });
        }
    };
    ResolversExplorerService = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__param(3, common_1.Inject(graphql_constants_1.GRAPHQL_MODULE_OPTIONS)),
        tslib_1.__metadata("design:paramtypes", [modules_container_1.ModulesContainer,
            metadata_scanner_1.MetadataScanner,
            external_context_creator_1.ExternalContextCreator, Object])
    ], ResolversExplorerService);
    return ResolversExplorerService;
})();
exports.ResolversExplorerService = ResolversExplorerService;
