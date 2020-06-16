"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaGenerationError = void 0;
class SchemaGenerationError extends Error {
    constructor(details) {
        super('Schema generation error (code-first approach)');
        this.details = details;
    }
}
exports.SchemaGenerationError = SchemaGenerationError;
