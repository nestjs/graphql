"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnionDefinitionFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const graphql_1 = require("graphql");
const return_type_cannot_be_resolved_error_1 = require("../errors/return-type-cannot-be-resolved.error");
const type_definitions_storage_1 = require("../storages/type-definitions.storage");
const resolve_type_factory_1 = require("./resolve-type.factory");
let UnionDefinitionFactory = (() => {
    let UnionDefinitionFactory = class UnionDefinitionFactory {
        constructor(resolveTypeFactory, typeDefinitionsStorage) {
            this.resolveTypeFactory = resolveTypeFactory;
            this.typeDefinitionsStorage = typeDefinitionsStorage;
        }
        create(metadata) {
            const getObjectType = (item) => this.typeDefinitionsStorage.getObjectTypeByTarget(item).type;
            const types = () => metadata.typesFn().map(item => getObjectType(item));
            return {
                id: metadata.id,
                type: new graphql_1.GraphQLUnionType({
                    name: metadata.name,
                    description: metadata.description,
                    types,
                    resolveType: this.createResolveTypeFn(metadata),
                }),
            };
        }
        createResolveTypeFn(metadata) {
            return metadata.resolveType
                ? this.resolveTypeFactory.getResolveTypeFunction(metadata.resolveType)
                : (instance) => {
                    const target = metadata
                        .typesFn()
                        .find(Type => instance instanceof Type);
                    if (!target) {
                        throw new return_type_cannot_be_resolved_error_1.ReturnTypeCannotBeResolvedError(metadata.name);
                    }
                    const objectDef = this.typeDefinitionsStorage.getObjectTypeByTarget(target);
                    return objectDef.type;
                };
        }
    };
    UnionDefinitionFactory = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [resolve_type_factory_1.ResolveTypeFactory,
            type_definitions_storage_1.TypeDefinitionsStorage])
    ], UnionDefinitionFactory);
    return UnionDefinitionFactory;
})();
exports.UnionDefinitionFactory = UnionDefinitionFactory;
