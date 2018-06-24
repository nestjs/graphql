"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const graphql_constants_1 = require("../graphql.constants");
function extractMetadata(instance, prototype, methodName, filterPredicate) {
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
exports.extractMetadata = extractMetadata;
