"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFieldsAndDecoratorForType = void 0;
require("reflect-metadata");
const decorators_1 = require("../../decorators");
const class_type_enum_1 = require("../../enums/class-type.enum");
const graphql_constants_1 = require("../../graphql.constants");
const unable_to_find_fields_error_1 = require("../errors/unable-to-find-fields.error");
const lazy_metadata_storage_1 = require("../storages/lazy-metadata.storage");
const type_metadata_storage_1 = require("../storages/type-metadata.storage");
function getFieldsAndDecoratorForType(objType) {
    const classType = Reflect.getMetadata(graphql_constants_1.CLASS_TYPE_METADATA, objType);
    if (!classType) {
        throw new unable_to_find_fields_error_1.UnableToFindFieldsError(objType.name);
    }
    lazy_metadata_storage_1.LazyMetadataStorage.load([objType]);
    type_metadata_storage_1.TypeMetadataStorage.compile();
    const [classMetadata, decoratorFactory,] = getClassMetadataAndFactoryByTargetAndType(classType, objType);
    let fields = classMetadata === null || classMetadata === void 0 ? void 0 : classMetadata.properties;
    if (!fields) {
        throw new unable_to_find_fields_error_1.UnableToFindFieldsError(objType.name);
    }
    fields = inheritClassFields(objType, fields);
    return {
        fields,
        decoratorFactory,
    };
}
exports.getFieldsAndDecoratorForType = getFieldsAndDecoratorForType;
function getClassMetadataAndFactoryByTargetAndType(classType, objType) {
    switch (classType) {
        case class_type_enum_1.ClassType.ARGS:
            return [
                type_metadata_storage_1.TypeMetadataStorage.getArgumentsMetadataByTarget(objType),
                decorators_1.ArgsType,
            ];
        case class_type_enum_1.ClassType.OBJECT:
            return [
                type_metadata_storage_1.TypeMetadataStorage.getObjectTypeMetadataByTarget(objType),
                decorators_1.ObjectType,
            ];
        case class_type_enum_1.ClassType.INPUT:
            return [
                type_metadata_storage_1.TypeMetadataStorage.getInputTypeMetadataByTarget(objType),
                decorators_1.InputType,
            ];
        case class_type_enum_1.ClassType.INTERFACE:
            return [
                type_metadata_storage_1.TypeMetadataStorage.getInterfaceMetadataByTarget(objType),
                decorators_1.InterfaceType,
            ];
    }
}
function inheritClassFields(objType, fields) {
    try {
        const parentClass = Object.getPrototypeOf(objType);
        if (parentClass === Function) {
            return fields;
        }
        const { fields: parentFields } = getFieldsAndDecoratorForType(parentClass);
        return inheritClassFields(parentClass, [...parentFields, ...fields]);
    }
    catch (err) {
        return fields;
    }
}
