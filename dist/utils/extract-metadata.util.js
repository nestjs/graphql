"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMetadata = void 0;
require("reflect-metadata");
const federation_constants_1 = require("../federation/federation.constants");
const graphql_constants_1 = require("../graphql.constants");
function extractMetadata(instance, prototype, methodName, filterPredicate) {
    const callback = prototype[methodName];
    const resolverType = Reflect.getMetadata(graphql_constants_1.RESOLVER_TYPE_METADATA, callback) ||
        Reflect.getMetadata(graphql_constants_1.RESOLVER_TYPE_METADATA, instance.constructor);
    const isPropertyResolver = !!Reflect.getMetadata(graphql_constants_1.RESOLVER_PROPERTY_METADATA, callback);
    const resolverName = Reflect.getMetadata(graphql_constants_1.RESOLVER_NAME_METADATA, callback);
    const isReferenceResolver = !!Reflect.getMetadata(federation_constants_1.RESOLVER_REFERENCE_METADATA, callback);
    if (filterPredicate(resolverType, isReferenceResolver, isPropertyResolver)) {
        return null;
    }
    const name = isReferenceResolver
        ? federation_constants_1.RESOLVER_REFERENCE_KEY
        : resolverName || methodName;
    return {
        type: resolverType,
        methodName,
        name,
    };
}
exports.extractMetadata = extractMetadata;
