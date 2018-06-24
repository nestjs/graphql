"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const metadata_scanner_1 = require("@nestjs/core/metadata-scanner");
const external_context_creator_1 = require("@nestjs/core/helpers/external-context-creator");
const modules_container_1 = require("@nestjs/core/injector/modules-container");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const lodash_1 = require("lodash");
const graphql_constants_1 = require("./graphql.constants");
let ResolversExplorerService = class ResolversExplorerService {
    constructor(modulesContainer, metadataScanner, externalContextCreator) {
        this.modulesContainer = modulesContainer;
        this.metadataScanner = metadataScanner;
        this.externalContextCreator = externalContextCreator;
    }
    explore() {
        const modules = [...this.modulesContainer.values()].map(module => module.components);
        const resolvers = this.flatMap(modules, instance => this.filterResolvers(instance));
        return this.groupMetadata(resolvers);
    }
    flatMap(modules, callback) {
        return lodash_1.flattenDeep(modules.map(module => [...module.values()].map(({ instance }) => callback(instance))));
    }
    filterResolvers(instance) {
        const prototype = Object.getPrototypeOf(instance);
        const predicate = (resolverType, isDelegated) => shared_utils_1.isUndefined(resolverType) || isDelegated;
        const resolvers = this.metadataScanner.scanFromPrototype(instance, prototype, name => this.extractMetadata(instance, prototype, name, predicate));
        return resolvers.filter(resolver => !!resolver).map(resolver => {
            if (resolver.type === 'Subscription') {
                return Object.assign({}, resolver, { callback: instance[resolver.methodName]() });
            }
            const resolverCallback = this.externalContextCreator.create(instance, prototype[resolver.methodName], resolver.methodName);
            return Object.assign({}, resolver, { callback: resolverCallback });
        });
    }
    exploreDelegates() {
        const modules = [...this.modulesContainer.values()].map(module => module.components);
        const delegates = this.flatMap(modules, instance => this.filterDelegates(instance));
        return this.curryDelegates(this.groupMetadata(delegates));
    }
    filterDelegates(instance) {
        const prototype = Object.getPrototypeOf(instance);
        const predicate = (resolverType, isDelegated) => !isDelegated;
        const resolvers = this.metadataScanner.scanFromPrototype(instance, prototype, name => this.extractMetadata(instance, prototype, name, predicate));
        return resolvers.filter(resolver => !!resolver).map(resolver => {
            const callback = instance[resolver.methodName].bind(instance);
            return Object.assign({}, resolver, { callback });
        });
    }
    extractMetadata(instance, prototype, methodName, filterPredicate) {
        const callback = prototype[methodName];
        const resolverType = Reflect.getMetadata(graphql_constants_1.RESOLVER_TYPE_METADATA, callback) ||
            Reflect.getMetadata(graphql_constants_1.RESOLVER_TYPE_METADATA, instance.constructor);
        const resolverName = Reflect.getMetadata(graphql_constants_1.RESOLVER_NAME_METADATA, callback);
        const isDelegated = !!Reflect.getMetadata(graphql_constants_1.RESOLVER_DELEGATE_METADATA, callback);
        if (filterPredicate(resolverType, isDelegated)) {
            return null;
        }
        return {
            name: resolverName || methodName,
            type: resolverType,
            methodName,
        };
    }
    groupMetadata(resolvers) {
        const groupByType = lodash_1.groupBy(resolvers, metadata => metadata.type);
        return lodash_1.mapValues(groupByType, resolversArr => resolversArr.reduce((prev, curr) => {
            return Object.assign({}, prev, { [curr.name]: curr.callback });
        }, {}));
    }
    curryDelegates(delegates) {
        return mergeInfo => lodash_1.mapValues(delegates, parent => lodash_1.mapValues(parent, (propertyFn, key) => propertyFn()(mergeInfo)));
    }
};
ResolversExplorerService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [modules_container_1.ModulesContainer,
        metadata_scanner_1.MetadataScanner,
        external_context_creator_1.ExternalContextCreator])
], ResolversExplorerService);
exports.ResolversExplorerService = ResolversExplorerService;
