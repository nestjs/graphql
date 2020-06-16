"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectTypeDefinitionFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const graphql_1 = require("graphql");
const orphaned_reference_registry_1 = require("../services/orphaned-reference.registry");
const type_fields_accessor_1 = require("../services/type-fields.accessor");
const type_definitions_storage_1 = require("../storages/type-definitions.storage");
const args_factory_1 = require("./args.factory");
const ast_definition_node_factory_1 = require("./ast-definition-node.factory");
const output_type_factory_1 = require("./output-type.factory");
let ObjectTypeDefinitionFactory = (() => {
    let ObjectTypeDefinitionFactory = class ObjectTypeDefinitionFactory {
        constructor(typeDefinitionsStorage, outputTypeFactory, typeFieldsAccessor, astDefinitionNodeFactory, orphanedReferenceRegistry, argsFactory) {
            this.typeDefinitionsStorage = typeDefinitionsStorage;
            this.outputTypeFactory = outputTypeFactory;
            this.typeFieldsAccessor = typeFieldsAccessor;
            this.astDefinitionNodeFactory = astDefinitionNodeFactory;
            this.orphanedReferenceRegistry = orphanedReferenceRegistry;
            this.argsFactory = argsFactory;
        }
        create(metadata, options) {
            const prototype = Object.getPrototypeOf(metadata.target);
            const getParentType = () => {
                const parentTypeDefinition = this.typeDefinitionsStorage.getObjectTypeByTarget(prototype);
                return parentTypeDefinition ? parentTypeDefinition.type : undefined;
            };
            return {
                target: metadata.target,
                isAbstract: metadata.isAbstract || false,
                interfaces: metadata.interfaces || [],
                type: new graphql_1.GraphQLObjectType({
                    name: metadata.name,
                    description: metadata.description,
                    astNode: this.astDefinitionNodeFactory.createObjectTypeNode(metadata.name, metadata.directives),
                    extensions: metadata.extensions,
                    interfaces: this.generateInterfaces(metadata, getParentType),
                    fields: this.generateFields(metadata, options, getParentType),
                }),
            };
        }
        generateInterfaces(metadata, getParentType) {
            const prototype = Object.getPrototypeOf(metadata.target);
            return () => {
                const interfaces = (metadata.interfaces || []).map((item) => this.typeDefinitionsStorage.getInterfaceByTarget(item).type);
                if (!shared_utils_1.isUndefined(prototype)) {
                    const parentClass = getParentType();
                    if (!parentClass) {
                        return interfaces;
                    }
                    const parentInterfaces = parentClass.getInterfaces();
                    return Array.from(new Set([...interfaces, ...parentInterfaces]));
                }
                return interfaces;
            };
        }
        generateFields(metadata, options, getParentType) {
            const prototype = Object.getPrototypeOf(metadata.target);
            metadata.properties.forEach(({ typeFn }) => this.orphanedReferenceRegistry.addToRegistryIfOrphaned(typeFn()));
            return () => {
                let fields = {};
                metadata.properties.forEach((field) => {
                    const type = this.outputTypeFactory.create(field.name, field.typeFn(), options, field.options);
                    fields[field.schemaName] = {
                        type,
                        args: this.argsFactory.create(field.methodArgs, options),
                        resolve: (root) => {
                            const value = root[field.name];
                            return typeof value === 'undefined'
                                ? field.options.defaultValue
                                : value;
                        },
                        description: field.description,
                        deprecationReason: field.deprecationReason,
                        astNode: this.astDefinitionNodeFactory.createFieldNode(field.name, type, field.directives),
                        extensions: Object.assign({ complexity: field.complexity }, field.extensions),
                    };
                });
                if (!shared_utils_1.isUndefined(prototype)) {
                    const parent = getParentType();
                    if (parent) {
                        const parentFields = this.typeFieldsAccessor.extractFromInterfaceOrObjectType(parent);
                        fields = Object.assign(Object.assign({}, parentFields), fields);
                    }
                }
                if (metadata.interfaces) {
                    let interfaceFields = {};
                    metadata.interfaces.forEach((item) => {
                        const interfaceType = this.typeDefinitionsStorage.getInterfaceByTarget(item).type;
                        const fieldMetadata = this.typeFieldsAccessor.extractFromInterfaceOrObjectType(interfaceType);
                        interfaceFields = Object.assign(Object.assign({}, interfaceFields), fieldMetadata);
                    });
                    fields = Object.assign(Object.assign({}, interfaceFields), fields);
                }
                return fields;
            };
        }
    };
    ObjectTypeDefinitionFactory = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [type_definitions_storage_1.TypeDefinitionsStorage,
            output_type_factory_1.OutputTypeFactory,
            type_fields_accessor_1.TypeFieldsAccessor,
            ast_definition_node_factory_1.AstDefinitionNodeFactory,
            orphaned_reference_registry_1.OrphanedReferenceRegistry,
            args_factory_1.ArgsFactory])
    ], ObjectTypeDefinitionFactory);
    return ObjectTypeDefinitionFactory;
})();
exports.ObjectTypeDefinitionFactory = ObjectTypeDefinitionFactory;
