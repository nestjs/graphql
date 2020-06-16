"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrphanedTypesFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const orphaned_reference_registry_1 = require("../services/orphaned-reference.registry");
const type_definitions_storage_1 = require("../storages/type-definitions.storage");
let OrphanedTypesFactory = (() => {
    let OrphanedTypesFactory = class OrphanedTypesFactory {
        constructor(typeDefinitionsStorage, orphanedReferenceRegistry) {
            this.typeDefinitionsStorage = typeDefinitionsStorage;
            this.orphanedReferenceRegistry = orphanedReferenceRegistry;
        }
        create(types) {
            types = (types || []).concat(this.orphanedReferenceRegistry.getAll());
            if (types.length === 0) {
                return [];
            }
            const interfaceTypeDefs = this.typeDefinitionsStorage.getAllInterfaceDefinitions();
            const objectTypeDefs = this.typeDefinitionsStorage.getAllObjectTypeDefinitions();
            const inputTypeDefs = this.typeDefinitionsStorage.getAllInputTypeDefinitions();
            const classTypeDefs = [
                ...interfaceTypeDefs,
                ...objectTypeDefs,
                ...inputTypeDefs,
            ];
            return classTypeDefs
                .filter(item => !item.isAbstract)
                .filter(item => {
                const implementsReferencedInterface = item.interfaces &&
                    item.interfaces.some(i => types.includes(i));
                return types.includes(item.target) || implementsReferencedInterface;
            })
                .map(({ type }) => type);
        }
    };
    OrphanedTypesFactory = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [type_definitions_storage_1.TypeDefinitionsStorage,
            orphaned_reference_registry_1.OrphanedReferenceRegistry])
    ], OrphanedTypesFactory);
    return OrphanedTypesFactory;
})();
exports.OrphanedTypesFactory = OrphanedTypesFactory;
