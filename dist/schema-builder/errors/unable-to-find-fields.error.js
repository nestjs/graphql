"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnableToFindFieldsError = void 0;
class UnableToFindFieldsError extends Error {
    constructor(name) {
        super(`Unable to find fields for GraphQL type ${name}. Is your class annotated with an appropriate decorator?`);
    }
}
exports.UnableToFindFieldsError = UnableToFindFieldsError;
