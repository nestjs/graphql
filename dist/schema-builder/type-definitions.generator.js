"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeDefinitionsGenerator = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const enum_definition_factory_1 = require("./factories/enum-definition.factory");
const input_type_definition_factory_1 = require("./factories/input-type-definition.factory");
const interface_definition_factory_1 = require("./factories/interface-definition.factory");
const object_type_definition_factory_1 = require("./factories/object-type-definition.factory");
const union_definition_factory_1 = require("./factories/union-definition.factory");
const type_definitions_storage_1 = require("./storages/type-definitions.storage");
const type_metadata_storage_1 = require("./storages/type-metadata.storage");
let TypeDefinitionsGenerator = (() => {
    let TypeDefinitionsGenerator = class TypeDefinitionsGenerator {
        constructor(typeDefinitionsStorage, enumDefinitionFactory, inputTypeDefinitionFactory, objectTypeDefinitionFactory, interfaceDefinitionFactory, unionDefinitionFactory) {
            this.typeDefinitionsStorage = typeDefinitionsStorage;
            this.enumDefinitionFactory = enumDefinitionFactory;
            this.inputTypeDefinitionFactory = inputTypeDefinitionFactory;
            this.objectTypeDefinitionFactory = objectTypeDefinitionFactory;
            this.interfaceDefinitionFactory = interfaceDefinitionFactory;
            this.unionDefinitionFactory = unionDefinitionFactory;
        }
        generate(options) {
            this.generateUnionDefs();
            this.generateEnumDefs();
            this.generateInterfaceDefs(options);
            this.generateObjectTypeDefs(options);
            this.generateInputTypeDefs(options);
        }
        generateInputTypeDefs(options) {
            const metadata = type_metadata_storage_1.TypeMetadataStorage.getInputTypesMetadata();
            const inputTypeDefs = metadata.map(metadata => this.inputTypeDefinitionFactory.create(metadata, options));
            this.typeDefinitionsStorage.addInputTypes(inputTypeDefs);
        }
        generateObjectTypeDefs(options) {
            const metadata = type_metadata_storage_1.TypeMetadataStorage.getObjectTypesMetadata();
            const objectTypeDefs = metadata.map(metadata => this.objectTypeDefinitionFactory.create(metadata, options));
            this.typeDefinitionsStorage.addObjectTypes(objectTypeDefs);
        }
        generateInterfaceDefs(options) {
            const metadata = type_metadata_storage_1.TypeMetadataStorage.getInterfacesMetadata();
            const interfaceDefs = metadata.map(metadata => this.interfaceDefinitionFactory.create(metadata, options));
            this.typeDefinitionsStorage.addInterfaces(interfaceDefs);
        }
        generateEnumDefs() {
            const metadata = type_metadata_storage_1.TypeMetadataStorage.getEnumsMetadata();
            const enumDefs = metadata.map(metadata => this.enumDefinitionFactory.create(metadata));
            this.typeDefinitionsStorage.addEnums(enumDefs);
        }
        generateUnionDefs() {
            const metadata = type_metadata_storage_1.TypeMetadataStorage.getUnionsMetadata();
            const unionDefs = metadata.map(metadata => this.unionDefinitionFactory.create(metadata));
            this.typeDefinitionsStorage.addUnions(unionDefs);
        }
    };
    TypeDefinitionsGenerator = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [type_definitions_storage_1.TypeDefinitionsStorage,
            enum_definition_factory_1.EnumDefinitionFactory,
            input_type_definition_factory_1.InputTypeDefinitionFactory,
            object_type_definition_factory_1.ObjectTypeDefinitionFactory,
            interface_definition_factory_1.InterfaceDefinitionFactory,
            union_definition_factory_1.UnionDefinitionFactory])
    ], TypeDefinitionsGenerator);
    return TypeDefinitionsGenerator;
})();
exports.TypeDefinitionsGenerator = TypeDefinitionsGenerator;
