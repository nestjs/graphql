"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootTypeFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const graphql_1 = require("graphql");
const orphaned_reference_registry_1 = require("../services/orphaned-reference.registry");
const args_factory_1 = require("./args.factory");
const ast_definition_node_factory_1 = require("./ast-definition-node.factory");
const output_type_factory_1 = require("./output-type.factory");
let RootTypeFactory = (() => {
    let RootTypeFactory = class RootTypeFactory {
        constructor(outputTypeFactory, argsFactory, astDefinitionNodeFactory, orphanedReferenceRegistry) {
            this.outputTypeFactory = outputTypeFactory;
            this.argsFactory = argsFactory;
            this.astDefinitionNodeFactory = astDefinitionNodeFactory;
            this.orphanedReferenceRegistry = orphanedReferenceRegistry;
        }
        create(typeRefs, resolversMetadata, objectTypeName, options, fieldsFactory = (handlers) => this.generateFields(handlers, options)) {
            const handlers = typeRefs
                ? resolversMetadata.filter((query) => typeRefs.includes(query.target))
                : resolversMetadata;
            if (handlers.length === 0) {
                return;
            }
            return new graphql_1.GraphQLObjectType({
                name: objectTypeName,
                fields: fieldsFactory(handlers, options),
            });
        }
        generateFields(handlers, options) {
            const fieldConfigMap = {};
            handlers
                .filter((handler) => !(handler.classMetadata && handler.classMetadata.isAbstract))
                .forEach((handler) => {
                this.orphanedReferenceRegistry.addToRegistryIfOrphaned(handler.typeFn());
                const type = this.outputTypeFactory.create(handler.methodName, handler.typeFn(), options, handler.returnTypeOptions);
                const key = handler.schemaName;
                fieldConfigMap[key] = {
                    type,
                    args: this.argsFactory.create(handler.methodArgs, options),
                    resolve: undefined,
                    description: handler.description,
                    deprecationReason: handler.deprecationReason,
                    astNode: this.astDefinitionNodeFactory.createFieldNode(key, type, handler.directives),
                    extensions: Object.assign({ complexity: handler.complexity }, handler.extensions),
                };
            });
            return fieldConfigMap;
        }
    };
    RootTypeFactory = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [output_type_factory_1.OutputTypeFactory,
            args_factory_1.ArgsFactory,
            ast_definition_node_factory_1.AstDefinitionNodeFactory,
            orphaned_reference_registry_1.OrphanedReferenceRegistry])
    ], RootTypeFactory);
    return RootTypeFactory;
})();
exports.RootTypeFactory = RootTypeFactory;
