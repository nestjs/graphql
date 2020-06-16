"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLAstExplorer = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const lodash_1 = require("lodash");
const graphql_constants_1 = require("./graphql.constants");
let tsMorphLib;
let GraphQLAstExplorer = (() => {
    let GraphQLAstExplorer = class GraphQLAstExplorer {
        constructor() {
            this.root = ['Query', 'Mutation', 'Subscription'];
        }
        explore(documentNode, outputPath, mode, options = {}) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (!documentNode) {
                    return;
                }
                tsMorphLib = yield Promise.resolve().then(() => require('ts-morph'));
                const tsAstHelper = new tsMorphLib.Project({
                    manipulationSettings: {
                        newLineKind: process.platform === 'win32'
                            ? tsMorphLib.NewLineKind.CarriageReturnLineFeed
                            : tsMorphLib.NewLineKind.LineFeed,
                    },
                });
                const tsFile = tsAstHelper.createSourceFile(outputPath, '', {
                    overwrite: true,
                });
                let { definitions } = documentNode;
                definitions = lodash_1.sortBy(definitions, ['kind', 'name']);
                definitions.forEach((item) => this.lookupDefinition(item, tsFile, mode, options));
                tsFile.insertText(0, graphql_constants_1.DEFINITIONS_FILE_HEADER);
                return tsFile;
            });
        }
        lookupDefinition(item, tsFile, mode, options) {
            switch (item.kind) {
                case 'SchemaDefinition':
                    return this.lookupRootSchemaDefinition(item.operationTypes, tsFile, mode);
                case 'ObjectTypeDefinition':
                case 'InputObjectTypeDefinition':
                    return this.addObjectTypeDefinition(item, tsFile, mode, options);
                case 'InterfaceTypeDefinition':
                    return this.addObjectTypeDefinition(item, tsFile, 'interface', options);
                case 'ScalarTypeDefinition':
                    return this.addScalarDefinition(item, tsFile);
                case 'EnumTypeDefinition':
                    return this.addEnumDefinition(item, tsFile);
                case 'UnionTypeDefinition':
                    return this.addUnionDefinition(item, tsFile);
            }
        }
        lookupRootSchemaDefinition(operationTypes, tsFile, mode) {
            const structureKind = mode === 'class'
                ? tsMorphLib.StructureKind.Class
                : tsMorphLib.StructureKind.Interface;
            const rootInterface = this.addClassOrInterface(tsFile, mode, {
                name: 'ISchema',
                isExported: true,
                kind: structureKind,
            });
            operationTypes.forEach((item) => {
                if (!item) {
                    return;
                }
                const tempOperationName = item.operation;
                const typeName = lodash_1.get(item, 'type.name.value');
                const interfaceName = typeName || tempOperationName;
                const interfaceRef = this.addClassOrInterface(tsFile, mode, {
                    name: this.addSymbolIfRoot(lodash_1.upperFirst(interfaceName)),
                    isExported: true,
                    kind: structureKind,
                });
                rootInterface.addProperty({
                    name: interfaceName,
                    type: interfaceRef.getName(),
                });
            });
        }
        addObjectTypeDefinition(item, tsFile, mode, options) {
            const parentName = lodash_1.get(item, 'name.value');
            if (!parentName) {
                return;
            }
            let parentRef = this.getClassOrInterface(tsFile, mode, this.addSymbolIfRoot(parentName));
            if (!parentRef) {
                const structureKind = mode === 'class'
                    ? tsMorphLib.StructureKind.Class
                    : tsMorphLib.StructureKind.Interface;
                const isRoot = this.root.indexOf(parentName) >= 0;
                parentRef = this.addClassOrInterface(tsFile, mode, {
                    name: this.addSymbolIfRoot(lodash_1.upperFirst(parentName)),
                    isExported: true,
                    isAbstract: isRoot && mode === 'class',
                    kind: structureKind,
                });
            }
            const interfaces = lodash_1.get(item, 'interfaces');
            if (interfaces) {
                if (mode === 'class') {
                    this.addImplementsInterfaces(interfaces, parentRef);
                }
                else {
                    this.addExtendInterfaces(interfaces, parentRef);
                }
            }
            const isObjectType = item.kind === 'ObjectTypeDefinition';
            if (isObjectType && options.emitTypenameField) {
                parentRef.addProperty({
                    name: '__typename',
                    type: `'${parentRef.getName()}'`,
                    hasQuestionToken: true,
                });
            }
            (item.fields || []).forEach((element) => {
                this.lookupFieldDefiniton(element, parentRef, mode, options);
            });
        }
        lookupFieldDefiniton(item, parentRef, mode, options) {
            switch (item.kind) {
                case 'FieldDefinition':
                case 'InputValueDefinition':
                    return this.lookupField(item, parentRef, mode, options);
            }
        }
        lookupField(item, parentRef, mode, options) {
            const propertyName = lodash_1.get(item, 'name.value');
            if (!propertyName) {
                return;
            }
            const federatedFields = ['_entities', '_service'];
            if (federatedFields.includes(propertyName)) {
                return;
            }
            const { name: type, required } = this.getFieldTypeDefinition(item.type);
            if (!this.isRoot(parentRef.getName())) {
                parentRef.addProperty({
                    name: propertyName,
                    type,
                    hasQuestionToken: !required,
                });
                return;
            }
            if (options.skipResolverArgs) {
                parentRef.addProperty({
                    name: propertyName,
                    type,
                    hasQuestionToken: !required,
                });
            }
            else {
                parentRef.addMethod({
                    isAbstract: mode === 'class',
                    name: propertyName,
                    returnType: `${type} | Promise<${type}>`,
                    parameters: this.getFunctionParameters(item.arguments),
                });
            }
        }
        getFieldTypeDefinition(type) {
            const { required, type: nestedType } = this.getNestedType(type);
            type = nestedType;
            const isArray = type.kind === 'ListType';
            if (isArray) {
                const { type: nestedType } = this.getNestedType(lodash_1.get(type, 'type'));
                type = nestedType;
                const typeName = lodash_1.get(type, 'name.value');
                return {
                    name: this.getType(typeName) + '[]',
                    required,
                };
            }
            const typeName = lodash_1.get(type, 'name.value');
            return {
                name: this.getType(typeName),
                required,
            };
        }
        getNestedType(type) {
            const isNonNullType = type.kind === 'NonNullType';
            if (isNonNullType) {
                return {
                    type: this.getNestedType(lodash_1.get(type, 'type')).type,
                    required: isNonNullType,
                };
            }
            return { type, required: false };
        }
        getType(typeName) {
            const defaults = this.getDefaultTypes();
            const isDefault = defaults[typeName];
            return isDefault ? defaults[typeName] : typeName;
        }
        getDefaultTypes() {
            return {
                String: 'string',
                Int: 'number',
                Boolean: 'boolean',
                ID: 'string',
                Float: 'number',
            };
        }
        getFunctionParameters(inputs) {
            if (!inputs) {
                return [];
            }
            return inputs.map((element) => {
                const { name, required } = this.getFieldTypeDefinition(element.type);
                return {
                    name: lodash_1.get(element, 'name.value'),
                    type: name,
                    hasQuestionToken: !required,
                    kind: tsMorphLib.StructureKind.Parameter,
                };
            });
        }
        addScalarDefinition(item, tsFile) {
            const name = lodash_1.get(item, 'name.value');
            if (!name || name === 'Date') {
                return;
            }
            tsFile.addTypeAlias({
                name,
                type: 'any',
                isExported: true,
            });
        }
        addExtendInterfaces(interfaces, parentRef) {
            if (!interfaces) {
                return;
            }
            interfaces.forEach((element) => {
                const interfaceName = lodash_1.get(element, 'name.value');
                if (interfaceName) {
                    parentRef.addExtends(interfaceName);
                }
            });
        }
        addImplementsInterfaces(interfaces, parentRef) {
            if (!interfaces) {
                return;
            }
            interfaces.forEach((element) => {
                const interfaceName = lodash_1.get(element, 'name.value');
                if (interfaceName) {
                    parentRef.addImplements(interfaceName);
                }
            });
        }
        addEnumDefinition(item, tsFile) {
            const name = lodash_1.get(item, 'name.value');
            if (!name) {
                return;
            }
            const members = lodash_1.map(item.values, (value) => ({
                name: lodash_1.get(value, 'name.value'),
                value: lodash_1.get(value, 'name.value'),
            }));
            tsFile.addEnum({
                name,
                members,
                isExported: true,
            });
        }
        addUnionDefinition(item, tsFile) {
            const name = lodash_1.get(item, 'name.value');
            if (!name) {
                return;
            }
            const types = lodash_1.map(item.types, (value) => lodash_1.get(value, 'name.value'));
            tsFile.addTypeAlias({
                name,
                type: types.join(' | '),
                isExported: true,
            });
        }
        addSymbolIfRoot(name) {
            return this.root.indexOf(name) >= 0 ? `I${name}` : name;
        }
        isRoot(name) {
            return ['IQuery', 'IMutation', 'ISubscription'].indexOf(name) >= 0;
        }
        addClassOrInterface(tsFile, mode, options) {
            return mode === 'class'
                ? tsFile.addClass(options)
                : tsFile.addInterface(options);
        }
        getClassOrInterface(tsFile, mode, name) {
            return mode === 'class' ? tsFile.getClass(name) : tsFile.getInterface(name);
        }
    };
    GraphQLAstExplorer = tslib_1.__decorate([
        common_1.Injectable()
    ], GraphQLAstExplorer);
    return GraphQLAstExplorer;
})();
exports.GraphQLAstExplorer = GraphQLAstExplorer;
