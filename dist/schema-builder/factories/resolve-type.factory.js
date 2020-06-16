"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolveTypeFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const type_definitions_storage_1 = require("../storages/type-definitions.storage");
let ResolveTypeFactory = (() => {
    let ResolveTypeFactory = class ResolveTypeFactory {
        constructor(typeDefinitionsStorage) {
            this.typeDefinitionsStorage = typeDefinitionsStorage;
        }
        getResolveTypeFunction(resolveType) {
            return (...args) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const resolvedType = yield resolveType(...args);
                if (shared_utils_1.isString(resolvedType)) {
                    return resolvedType;
                }
                const typeDef = this.typeDefinitionsStorage.getObjectTypeByTarget(resolvedType);
                return typeDef === null || typeDef === void 0 ? void 0 : typeDef.type;
            });
        }
    };
    ResolveTypeFactory = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [type_definitions_storage_1.TypeDefinitionsStorage])
    ], ResolveTypeFactory);
    return ResolveTypeFactory;
})();
exports.ResolveTypeFactory = ResolveTypeFactory;
