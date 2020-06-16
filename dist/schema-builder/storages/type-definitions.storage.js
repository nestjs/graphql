"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeDefinitionsStorage = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
let TypeDefinitionsStorage = (() => {
    let TypeDefinitionsStorage = class TypeDefinitionsStorage {
        constructor() {
            this.interfaceTypeDefinitions = new Map();
            this.enumTypeDefinitions = new Map();
            this.unionTypeDefinitions = new Map();
            this.objectTypeDefinitions = new Map();
            this.inputTypeDefinitions = new Map();
        }
        addEnums(enumDefs) {
            enumDefs.forEach(item => this.enumTypeDefinitions.set(item.enumRef, item));
        }
        getEnumByObject(obj) {
            return this.enumTypeDefinitions.get(obj);
        }
        addUnions(unionDefs) {
            unionDefs.forEach(item => this.unionTypeDefinitions.set(item.id, item));
        }
        getUnionBySymbol(key) {
            return this.unionTypeDefinitions.get(key);
        }
        addInterfaces(interfaceDefs) {
            interfaceDefs.forEach(item => this.interfaceTypeDefinitions.set(item.target, item));
        }
        getInterfaceByTarget(type) {
            return this.interfaceTypeDefinitions.get(type);
        }
        getAllInterfaceDefinitions() {
            return Array.from(this.interfaceTypeDefinitions.values());
        }
        addInputTypes(inputDefs) {
            inputDefs.forEach(item => this.inputTypeDefinitions.set(item.target, item));
        }
        getInputTypeByTarget(type) {
            return this.inputTypeDefinitions.get(type);
        }
        getAllInputTypeDefinitions() {
            return Array.from(this.inputTypeDefinitions.values());
        }
        addObjectTypes(objectDefs) {
            objectDefs.forEach(item => this.objectTypeDefinitions.set(item.target, item));
        }
        getObjectTypeByTarget(type) {
            return this.objectTypeDefinitions.get(type);
        }
        getAllObjectTypeDefinitions() {
            return Array.from(this.objectTypeDefinitions.values());
        }
        getInputTypeAndExtract(key) {
            if (!this.inputTypeDefinitionsLinks) {
                this.inputTypeDefinitionsLinks = new Map([
                    ...this.enumTypeDefinitions.entries(),
                    ...this.inputTypeDefinitions.entries(),
                ]);
            }
            const definition = this.inputTypeDefinitionsLinks.get(key);
            if (definition) {
                return definition.type;
            }
            return;
        }
        getOutputTypeAndExtract(key) {
            if (!this.outputTypeDefinitionsLinks) {
                this.outputTypeDefinitionsLinks = new Map([
                    ...this.objectTypeDefinitions.entries(),
                    ...this.interfaceTypeDefinitions.entries(),
                    ...this.enumTypeDefinitions.entries(),
                    ...this.unionTypeDefinitions.entries(),
                ]);
            }
            const definition = this.outputTypeDefinitionsLinks.get(key);
            if (definition) {
                return definition.type;
            }
            return;
        }
    };
    TypeDefinitionsStorage = tslib_1.__decorate([
        common_1.Injectable()
    ], TypeDefinitionsStorage);
    return TypeDefinitionsStorage;
})();
exports.TypeDefinitionsStorage = TypeDefinitionsStorage;
