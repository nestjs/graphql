"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationTypeFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const type_metadata_storage_1 = require("../storages/type-metadata.storage");
const root_type_factory_1 = require("./root-type.factory");
let MutationTypeFactory = (() => {
    let MutationTypeFactory = class MutationTypeFactory {
        constructor(rootTypeFactory) {
            this.rootTypeFactory = rootTypeFactory;
        }
        create(typeRefs, options) {
            const objectTypeName = 'Mutation';
            const mutationsMetadata = type_metadata_storage_1.TypeMetadataStorage.getMutationsMetadata();
            return this.rootTypeFactory.create(typeRefs, mutationsMetadata, objectTypeName, options);
        }
    };
    MutationTypeFactory = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [root_type_factory_1.RootTypeFactory])
    ], MutationTypeFactory);
    return MutationTypeFactory;
})();
exports.MutationTypeFactory = MutationTypeFactory;
