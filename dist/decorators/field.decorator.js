"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFieldMetadata = exports.Field = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const lazy_metadata_storage_1 = require("../schema-builder/storages/lazy-metadata.storage");
const type_metadata_storage_1 = require("../schema-builder/storages/type-metadata.storage");
const reflection_utilts_1 = require("../utils/reflection.utilts");
function Field(typeOrOptions, fieldOptions) {
    return (prototype, propertyKey, descriptor) => {
        addFieldMetadata(typeOrOptions, fieldOptions, prototype, propertyKey, descriptor);
    };
}
exports.Field = Field;
function addFieldMetadata(typeOrOptions, fieldOptions, prototype, propertyKey, descriptor, loadEagerly) {
    const [typeFunc, options = {}] = shared_utils_1.isFunction(typeOrOptions)
        ? [typeOrOptions, fieldOptions]
        : [undefined, typeOrOptions];
    const applyMetadataFn = () => {
        const isResolver = !!descriptor;
        const isResolverMethod = !!(descriptor && descriptor.value);
        const { typeFn: getType, options: typeOptions } = reflection_utilts_1.reflectTypeFromMetadata({
            metadataKey: isResolverMethod ? 'design:returntype' : 'design:type',
            prototype,
            propertyKey,
            explicitTypeFn: typeFunc,
            typeOptions: options,
        });
        type_metadata_storage_1.TypeMetadataStorage.addClassFieldMetadata({
            name: propertyKey,
            schemaName: options.name || propertyKey,
            typeFn: getType,
            options: typeOptions,
            target: prototype.constructor,
            description: options.description,
            deprecationReason: options.deprecationReason,
            complexity: options.complexity,
        });
        if (isResolver) {
            type_metadata_storage_1.TypeMetadataStorage.addResolverPropertyMetadata({
                kind: 'internal',
                methodName: propertyKey,
                schemaName: options.name || propertyKey,
                target: prototype.constructor,
                complexity: options.complexity,
            });
        }
    };
    if (loadEagerly) {
        applyMetadataFn();
    }
    else {
        lazy_metadata_storage_1.LazyMetadataStorage.store(applyMetadataFn);
    }
}
exports.addFieldMetadata = addFieldMetadata;
