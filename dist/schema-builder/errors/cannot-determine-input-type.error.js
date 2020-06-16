"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotDetermineInputTypeError = void 0;
class CannotDetermineInputTypeError extends Error {
    constructor(hostType) {
        super(`Cannot determine a GraphQL input type for the "${hostType}". Make sure your class is decorated with an appropriate decorator.`);
    }
}
exports.CannotDetermineInputTypeError = CannotDetermineInputTypeError;
