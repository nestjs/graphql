"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntersectionType = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const decorators_1 = require("../decorators");
const get_fields_and_decorator_util_1 = require("../schema-builder/utils/get-fields-and-decorator.util");
function IntersectionType(classARef, classBRef, decorator) {
    const { decoratorFactory, fields: fieldsA } = get_fields_and_decorator_util_1.getFieldsAndDecoratorForType(classARef);
    const { fields: fieldsB } = get_fields_and_decorator_util_1.getFieldsAndDecoratorForType(classBRef);
    const fields = [...fieldsA, ...fieldsB];
    class IntersectionObjectType {
    }
    if (decorator) {
        decorator({ isAbstract: true })(IntersectionObjectType);
    }
    else {
        decoratorFactory({ isAbstract: true })(IntersectionObjectType);
    }
    mapped_types_1.inheritValidationMetadata(classARef, IntersectionObjectType);
    mapped_types_1.inheritTransformationMetadata(classARef, IntersectionObjectType);
    mapped_types_1.inheritValidationMetadata(classBRef, IntersectionObjectType);
    mapped_types_1.inheritTransformationMetadata(classBRef, IntersectionObjectType);
    fields.forEach((item) => {
        decorators_1.Field(item.typeFn, Object.assign({}, item.options))(IntersectionObjectType.prototype, item.name);
    });
    Object.defineProperty(IntersectionObjectType, 'name', {
        value: `Intersection${classARef.name}${classBRef.name}`,
    });
    return IntersectionObjectType;
}
exports.IntersectionType = IntersectionType;
