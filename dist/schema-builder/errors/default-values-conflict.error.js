"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultValuesConflictError = void 0;
class DefaultValuesConflictError extends Error {
    constructor(hostTypeName, fieldName, decoratorDefaultVal, initializerDefaultVal) {
        super(`Error caused by mis-matched default values for the "${fieldName}" field of "${hostTypeName}". The default value from the decorator "${decoratorDefaultVal}" is not equal to the property initializer value "${initializerDefaultVal}". Ensure that these values match.`);
    }
}
exports.DefaultValuesConflictError = DefaultValuesConflictError;
