"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UndefinedResolverTypeError = void 0;
class UndefinedResolverTypeError extends Error {
    constructor(name) {
        super(`Undefined ressolver type error. Make sure you are providing an explicit object type for the "${name}" (e.g., "@Resolver(() => Cat)").`);
    }
}
exports.UndefinedResolverTypeError = UndefinedResolverTypeError;
