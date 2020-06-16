"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLSchemaBuilderModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const factories_1 = require("./factories/factories");
const graphql_schema_factory_1 = require("./graphql-schema.factory");
const file_system_helper_1 = require("./helpers/file-system.helper");
const orphaned_reference_registry_1 = require("./services/orphaned-reference.registry");
const type_fields_accessor_1 = require("./services/type-fields.accessor");
const type_mapper_service_1 = require("./services/type-mapper.service");
const type_definitions_storage_1 = require("./storages/type-definitions.storage");
const type_definitions_generator_1 = require("./type-definitions.generator");
let GraphQLSchemaBuilderModule = (() => {
    let GraphQLSchemaBuilderModule = class GraphQLSchemaBuilderModule {
    };
    GraphQLSchemaBuilderModule = tslib_1.__decorate([
        common_1.Module({
            providers: [
                ...factories_1.schemaBuilderFactories,
                graphql_schema_factory_1.GraphQLSchemaFactory,
                type_definitions_generator_1.TypeDefinitionsGenerator,
                file_system_helper_1.FileSystemHelper,
                type_definitions_storage_1.TypeDefinitionsStorage,
                type_mapper_service_1.TypeMapperSevice,
                type_fields_accessor_1.TypeFieldsAccessor,
                orphaned_reference_registry_1.OrphanedReferenceRegistry,
            ],
            exports: [graphql_schema_factory_1.GraphQLSchemaFactory, file_system_helper_1.FileSystemHelper],
        })
    ], GraphQLSchemaBuilderModule);
    return GraphQLSchemaBuilderModule;
})();
exports.GraphQLSchemaBuilderModule = GraphQLSchemaBuilderModule;
