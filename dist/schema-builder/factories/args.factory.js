"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgsFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const get_default_value_helper_1 = require("../helpers/get-default-value.helper");
const type_metadata_storage_1 = require("../storages/type-metadata.storage");
const input_type_factory_1 = require("./input-type.factory");
let ArgsFactory = (() => {
    let ArgsFactory = class ArgsFactory {
        constructor(inputTypeFactory) {
            this.inputTypeFactory = inputTypeFactory;
        }
        create(args, options) {
            const fieldConfigMap = {};
            args.forEach(param => {
                if (param.kind === 'arg') {
                    fieldConfigMap[param.name] = {
                        description: param.description,
                        type: this.inputTypeFactory.create(param.name, param.typeFn(), options, param.options),
                        defaultValue: param.options.defaultValue,
                    };
                }
                else if (param.kind === 'args') {
                    const argumentTypes = type_metadata_storage_1.TypeMetadataStorage.getArgumentsMetadata();
                    const hostType = param.typeFn();
                    const argumentType = argumentTypes.find(item => item.target === hostType);
                    let parent = Object.getPrototypeOf(argumentType.target);
                    while (!shared_utils_1.isUndefined(parent.prototype)) {
                        const parentArgType = argumentTypes.find(item => item.target === parent);
                        if (parentArgType) {
                            this.inheritParentArgs(parentArgType, options, fieldConfigMap);
                        }
                        parent = Object.getPrototypeOf(parent);
                    }
                    this.inheritParentArgs(argumentType, options, fieldConfigMap);
                }
            });
            return fieldConfigMap;
        }
        inheritParentArgs(argType, options, fieldConfigMap = {}) {
            const argumentInstance = new argType.target();
            argType.properties.forEach(field => {
                field.options.defaultValue = get_default_value_helper_1.getDefaultValue(argumentInstance, field.options, field.name, argType.name);
                const { schemaName } = field;
                fieldConfigMap[schemaName] = {
                    description: field.description,
                    type: this.inputTypeFactory.create(field.name, field.typeFn(), options, field.options),
                    defaultValue: field.options.defaultValue,
                };
            });
        }
    };
    ArgsFactory = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [input_type_factory_1.InputTypeFactory])
    ], ArgsFactory);
    return ArgsFactory;
})();
exports.ArgsFactory = ArgsFactory;
