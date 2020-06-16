"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultNullableConflictError = void 0;
class DefaultNullableConflictError extends Error {
    constructor(hostTypeName, defaultVal, isNullable) {
        super(`Incorrect "nullable" option value set for ${hostTypeName}. Do not combine "defaultValue: ${defaultVal}" with "nullable: ${isNullable}".`);
    }
}
exports.DefaultNullableConflictError = DefaultNullableConflictError;
