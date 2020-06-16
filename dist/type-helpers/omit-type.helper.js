"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmitType = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const mapped_types_1 = require("@nestjs/mapped-types");
const decorators_1 = require("../decorators");
const get_fields_and_decorator_util_1 = require("../schema-builder/utils/get-fields-and-decorator.util");
function OmitType(classRef, keys, decorator) {
    const { fields, decoratorFactory } = get_fields_and_decorator_util_1.getFieldsAndDecoratorForType(classRef);
    class OmitObjectType {
    }
    if (decorator) {
        decorator({ isAbstract: true })(OmitObjectType);
    }
    else {
        decoratorFactory({ isAbstract: true })(OmitObjectType);
    }
    const isInheritedPredicate = (propertyKey) => !keys.includes(propertyKey);
    mapped_types_1.inheritValidationMetadata(classRef, OmitObjectType, isInheritedPredicate);
    mapped_types_1.inheritTransformationMetadata(classRef, OmitObjectType, isInheritedPredicate);
    fields
        .filter((item) => !keys.includes(item.schemaName))
        .forEach((item) => {
        if (shared_utils_1.isFunction(item.typeFn)) {
            item.typeFn();
        }
        decorators_1.Field(item.typeFn, Object.assign({}, item.options))(OmitObjectType.prototype, item.name);
    });
    return OmitObjectType;
}
exports.OmitType = OmitType;
