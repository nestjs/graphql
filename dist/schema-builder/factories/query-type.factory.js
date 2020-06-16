"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryTypeFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const type_metadata_storage_1 = require("../storages/type-metadata.storage");
const root_type_factory_1 = require("./root-type.factory");
let QueryTypeFactory = (() => {
    let QueryTypeFactory = class QueryTypeFactory {
        constructor(rootTypeFactory) {
            this.rootTypeFactory = rootTypeFactory;
        }
        create(typeRefs, options) {
            const objectTypeName = 'Query';
            const queriesMetadata = type_metadata_storage_1.TypeMetadataStorage.getQueriesMetadata();
            return this.rootTypeFactory.create(typeRefs, queriesMetadata, objectTypeName, options);
        }
    };
    QueryTypeFactory = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [root_type_factory_1.RootTypeFactory])
    ], QueryTypeFactory);
    return QueryTypeFactory;
})();
exports.QueryTypeFactory = QueryTypeFactory;
