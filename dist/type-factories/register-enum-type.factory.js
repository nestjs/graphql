"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEnumType = void 0;
const lazy_metadata_storage_1 = require("../schema-builder/storages/lazy-metadata.storage");
const type_metadata_storage_1 = require("../schema-builder/storages/type-metadata.storage");
function registerEnumType(enumRef, options) {
    lazy_metadata_storage_1.LazyMetadataStorage.store(() => type_metadata_storage_1.TypeMetadataStorage.addEnumMetadata({
        ref: enumRef,
        name: options.name,
        description: options.description,
    }));
}
exports.registerEnumType = registerEnumType;
