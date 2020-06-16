"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputTypeDefinitionFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const graphql_1 = require("graphql");
const get_default_value_helper_1 = require("../helpers/get-default-value.helper");
const type_fields_accessor_1 = require("../services/type-fields.accessor");
const type_definitions_storage_1 = require("../storages/type-definitions.storage");
const ast_definition_node_factory_1 = require("./ast-definition-node.factory");
const input_type_factory_1 = require("./input-type.factory");
let InputTypeDefinitionFactory = (() => {
    let InputTypeDefinitionFactory = class InputTypeDefinitionFactory {
        constructor(typeDefinitionsStorage, inputTypeFactory, typeFieldsAccessor, astDefinitionNodeFactory) {
            this.typeDefinitionsStorage = typeDefinitionsStorage;
            this.inputTypeFactory = inputTypeFactory;
            this.typeFieldsAccessor = typeFieldsAccessor;
            this.astDefinitionNodeFactory = astDefinitionNodeFactory;
        }
        create(metadata, options) {
            return {
                target: metadata.target,
                isAbstract: metadata.isAbstract || false,
                type: new graphql_1.GraphQLInputObjectType({
                    name: metadata.name,
                    description: metadata.description,
                    fields: this.generateFields(metadata, options),
                    astNode: this.astDefinitionNodeFactory.createInputObjectTypeNode(metadata.name, metadata.directives),
                    extensions: metadata.extensions,
                }),
            };
        }
        generateFields(metadata, options) {
            const instance = new metadata.target();
            const prototype = Object.getPrototypeOf(metadata.target);
            const getParentType = () => {
                const parentTypeDefinition = this.typeDefinitionsStorage.getInputTypeByTarget(prototype);
                return parentTypeDefinition ? parentTypeDefinition.type : undefined;
            };
            return () => {
                let fields = {};
                metadata.properties.forEach((property) => {
                    property.options.defaultValue = get_default_value_helper_1.getDefaultValue(instance, property.options, property.name, metadata.name);
                    const type = this.inputTypeFactory.create(property.name, property.typeFn(), options, property.options);
                    fields[property.schemaName] = {
                        description: property.description,
                        type,
                        defaultValue: property.options.defaultValue,
                        astNode: this.astDefinitionNodeFactory.createInputValueNode(property.name, type, property.directives),
                        extensions: metadata.extensions,
                    };
                });
                if (!shared_utils_1.isUndefined(prototype.prototype)) {
                    const parentClassRef = getParentType();
                    if (parentClassRef) {
                        const parentFields = this.typeFieldsAccessor.extractFromInputType(parentClassRef);
                        fields = Object.assign(Object.assign({}, parentFields), fields);
                    }
                }
                return fields;
            };
        }
    };
    InputTypeDefinitionFactory = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [type_definitions_storage_1.TypeDefinitionsStorage,
            input_type_factory_1.InputTypeFactory,
            type_fields_accessor_1.TypeFieldsAccessor,
            ast_definition_node_factory_1.AstDefinitionNodeFactory])
    ], InputTypeDefinitionFactory);
    return InputTypeDefinitionFactory;
})();
exports.InputTypeDefinitionFactory = InputTypeDefinitionFactory;
