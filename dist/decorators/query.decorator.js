"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
require("reflect-metadata");
const resolver_enum_1 = require("../enums/resolver.enum");
const undefined_return_type_error_1 = require("../schema-builder/errors/undefined-return-type.error");
const lazy_metadata_storage_1 = require("../schema-builder/storages/lazy-metadata.storage");
const type_metadata_storage_1 = require("../schema-builder/storages/type-metadata.storage");
const reflection_utilts_1 = require("../utils/reflection.utilts");
const resolvers_utils_1 = require("./resolvers.utils");
function Query(nameOrType, options = {}) {
    return (target, key, descriptor) => {
        const name = shared_utils_1.isString(nameOrType)
            ? nameOrType
            : (options && options.name) || undefined;
        resolvers_utils_1.addResolverMetadata(resolver_enum_1.Resolver.QUERY, name, target, key, descriptor);
        lazy_metadata_storage_1.LazyMetadataStorage.store(target.constructor, () => {
            if (!nameOrType || shared_utils_1.isString(nameOrType)) {
                throw new undefined_return_type_error_1.UndefinedReturnTypeError(Query.name, key);
            }
            const { typeFn, options: typeOptions } = reflection_utilts_1.reflectTypeFromMetadata({
                metadataKey: 'design:returntype',
                prototype: target,
                propertyKey: key,
                explicitTypeFn: nameOrType,
                typeOptions: options || {},
            });
            const metadata = {
                methodName: key,
                schemaName: options.name || key,
                target: target.constructor,
                typeFn,
                returnTypeOptions: typeOptions,
                description: options.description,
                deprecationReason: options.deprecationReason,
            };
            type_metadata_storage_1.TypeMetadataStorage.addQueryMetadata(metadata);
        });
    };
}
exports.Query = Query;
