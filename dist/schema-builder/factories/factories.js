"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaBuilderFactories = void 0;
const args_factory_1 = require("./args.factory");
const ast_definition_node_factory_1 = require("./ast-definition-node.factory");
const enum_definition_factory_1 = require("./enum-definition.factory");
const input_type_definition_factory_1 = require("./input-type-definition.factory");
const input_type_factory_1 = require("./input-type.factory");
const interface_definition_factory_1 = require("./interface-definition.factory");
const mutation_type_factory_1 = require("./mutation-type.factory");
const object_type_definition_factory_1 = require("./object-type-definition.factory");
const orphaned_types_factory_1 = require("./orphaned-types.factory");
const output_type_factory_1 = require("./output-type.factory");
const query_type_factory_1 = require("./query-type.factory");
const resolve_type_factory_1 = require("./resolve-type.factory");
const root_type_factory_1 = require("./root-type.factory");
const subscription_type_factory_1 = require("./subscription-type.factory");
const union_definition_factory_1 = require("./union-definition.factory");
exports.schemaBuilderFactories = [
    enum_definition_factory_1.EnumDefinitionFactory,
    input_type_definition_factory_1.InputTypeDefinitionFactory,
    args_factory_1.ArgsFactory,
    input_type_factory_1.InputTypeFactory,
    interface_definition_factory_1.InterfaceDefinitionFactory,
    mutation_type_factory_1.MutationTypeFactory,
    object_type_definition_factory_1.ObjectTypeDefinitionFactory,
    output_type_factory_1.OutputTypeFactory,
    orphaned_types_factory_1.OrphanedTypesFactory,
    output_type_factory_1.OutputTypeFactory,
    query_type_factory_1.QueryTypeFactory,
    resolve_type_factory_1.ResolveTypeFactory,
    root_type_factory_1.RootTypeFactory,
    subscription_type_factory_1.SubscriptionTypeFactory,
    union_definition_factory_1.UnionDefinitionFactory,
    ast_definition_node_factory_1.AstDefinitionNodeFactory,
];
