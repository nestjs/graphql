"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolveField = void 0;
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const graphql_constants_1 = require("../graphql.constants");
const lazy_metadata_storage_1 = require("../schema-builder/storages/lazy-metadata.storage");
const type_metadata_storage_1 = require("../schema-builder/storages/type-metadata.storage");
const reflection_utilts_1 = require("../utils/reflection.utilts");
function ResolveField(propertyNameOrFunc, typeFuncOrOptions, resolveFieldOptions) {
    return (target, key, descriptor) => {
        let [propertyName, typeFunc, options] = shared_utils_1.isFunction(propertyNameOrFunc)
            ? typeFuncOrOptions && typeFuncOrOptions.name
                ? [typeFuncOrOptions.name, propertyNameOrFunc, typeFuncOrOptions]
                : [undefined, propertyNameOrFunc, typeFuncOrOptions]
            : [propertyNameOrFunc, typeFuncOrOptions, resolveFieldOptions];
        common_1.SetMetadata(graphql_constants_1.RESOLVER_NAME_METADATA, propertyName)(target, key, descriptor);
        common_1.SetMetadata(graphql_constants_1.RESOLVER_PROPERTY_METADATA, true)(target, key, descriptor);
        options = shared_utils_1.isObject(options)
            ? Object.assign({ name: propertyName }, options) : propertyName
            ? { name: propertyName }
            : {};
        lazy_metadata_storage_1.LazyMetadataStorage.store(target.constructor, () => {
            let typeOptions, typeFn;
            try {
                const implicitTypeMetadata = reflection_utilts_1.reflectTypeFromMetadata({
                    metadataKey: 'design:returntype',
                    prototype: target,
                    propertyKey: key,
                    explicitTypeFn: typeFunc,
                    typeOptions: options,
                });
                typeOptions = implicitTypeMetadata.options;
                typeFn = implicitTypeMetadata.typeFn;
            }
            catch (_a) { }
            type_metadata_storage_1.TypeMetadataStorage.addResolverPropertyMetadata({
                kind: 'external',
                methodName: key,
                schemaName: options.name || key,
                target: target.constructor,
                typeFn,
                typeOptions,
                description: options.description,
                deprecationReason: options.deprecationReason,
                complexity: options.complexity,
            });
        });
    };
}
exports.ResolveField = ResolveField;
