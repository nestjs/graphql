"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UndefinedReturnTypeError = void 0;
class UndefinedReturnTypeError extends Error {
    constructor(decoratorName, methodKey) {
        super(`"${decoratorName}.${methodKey}" was defined in resolvers, but not in schema. If you use the @${decoratorName}() decorator with the code first approach enabled, remember to explicitly provide a return type function, e.g. @${decoratorName}(returns => Author).`);
    }
}
exports.UndefinedReturnTypeError = UndefinedReturnTypeError;
