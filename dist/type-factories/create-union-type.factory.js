"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUnionType = void 0;
const lazy_metadata_storage_1 = require("../schema-builder/storages/lazy-metadata.storage");
const type_metadata_storage_1 = require("../schema-builder/storages/type-metadata.storage");
function createUnionType(options) {
    const { name, description, types, resolveType } = options;
    const id = Symbol(name);
    lazy_metadata_storage_1.LazyMetadataStorage.store(() => type_metadata_storage_1.TypeMetadataStorage.addUnionMetadata({
        id,
        name,
        description,
        typesFn: types,
        resolveType,
    }));
    return id;
}
exports.createUnionType = createUnionType;
