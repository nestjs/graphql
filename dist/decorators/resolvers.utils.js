"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassOrUndefined = exports.getResolverTypeFn = exports.getClassName = exports.addResolverMetadata = void 0;
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const graphql_constants_1 = require("../graphql.constants");
const undefined_resolver_type_error_1 = require("../schema-builder/errors/undefined-resolver-type.error");
function addResolverMetadata(resolver, name, target, key, descriptor) {
    common_1.SetMetadata(graphql_constants_1.RESOLVER_TYPE_METADATA, resolver || name)(target, key, descriptor);
    common_1.SetMetadata(graphql_constants_1.RESOLVER_NAME_METADATA, name)(target, key, descriptor);
}
exports.addResolverMetadata = addResolverMetadata;
function getClassName(nameOrType) {
    if (shared_utils_1.isString(nameOrType)) {
        return nameOrType;
    }
    const classOrUndefined = getClassOrUndefined(nameOrType);
    return classOrUndefined && classOrUndefined.name;
}
exports.getClassName = getClassName;
function getResolverTypeFn(nameOrType, target) {
    return nameOrType
        ? nameOrType.prototype
            ? () => nameOrType
            : nameOrType
        : () => {
            throw new undefined_resolver_type_error_1.UndefinedResolverTypeError(target.name);
        };
}
exports.getResolverTypeFn = getResolverTypeFn;
function getClassOrUndefined(typeOrFunc) {
    return isConstructor(typeOrFunc)
        ? typeOrFunc
        : shared_utils_1.isFunction(typeOrFunc)
            ? typeOrFunc()
            : undefined;
}
exports.getClassOrUndefined = getClassOrUndefined;
function isConstructor(obj) {
    return (!!obj.prototype &&
        !!obj.prototype.constructor &&
        !!obj.prototype.constructor.name);
}
