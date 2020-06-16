"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reflectTypeFromMetadata = void 0;
const lodash_1 = require("lodash");
const undefined_type_error_1 = require("../schema-builder/errors/undefined-type.error");
const NOT_ALLOWED_TYPES = [Promise, Array, Object, Function];
function reflectTypeFromMetadata(reflectOptions) {
    const { metadataKey, prototype, propertyKey, explicitTypeFn, typeOptions = {}, index, } = reflectOptions;
    const options = Object.assign({}, typeOptions);
    const reflectedType = Reflect.getMetadata(metadataKey, prototype, propertyKey);
    const implicitType = extractTypeIfArray(metadataKey, reflectedType, index);
    const isNotAllowed = implicitType && NOT_ALLOWED_TYPES.includes(implicitType);
    if ((!explicitTypeFn && (!implicitType || isNotAllowed)) ||
        (!implicitType && !explicitTypeFn)) {
        throw new undefined_type_error_1.UndefinedTypeError(lodash_1.get(prototype, 'constructor.name'), propertyKey, index);
    }
    if (explicitTypeFn) {
        return {
            typeFn: createWrappedExplicitTypeFn(explicitTypeFn, options),
            options,
        };
    }
    return {
        typeFn: () => implicitType,
        options: implicitType === Array
            ? Object.assign(Object.assign({}, options), { isArray: true, arrayDepth: 1 }) : options,
    };
}
exports.reflectTypeFromMetadata = reflectTypeFromMetadata;
function extractTypeIfArray(metadataKey, reflectedType, index) {
    if (metadataKey === 'design:paramtypes') {
        return reflectedType[index];
    }
    return reflectedType;
}
function getTypeReferenceAndArrayDepth([typeOrArray], depth = 1) {
    if (!Array.isArray(typeOrArray)) {
        return { depth, typeRef: typeOrArray };
    }
    return getTypeReferenceAndArrayDepth(typeOrArray, depth + 1);
}
function createWrappedExplicitTypeFn(explicitTypeFn, options) {
    return () => {
        const explicitTypeRef = explicitTypeFn();
        if (Array.isArray(explicitTypeRef)) {
            const { depth, typeRef } = getTypeReferenceAndArrayDepth(explicitTypeRef);
            options.isArray = true;
            options.arrayDepth = depth;
            return typeRef;
        }
        return explicitTypeRef;
    };
}
