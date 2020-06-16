"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UndefinedTypeError = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
class UndefinedTypeError extends Error {
    constructor(name, key, index) {
        super(`Undefined type error. Make sure you are providing an explicit type for the "${key}" ${shared_utils_1.isUndefined(index) ? '' : `(parameter at index [${index}]) `}of the "${name}" class.`);
    }
}
exports.UndefinedTypeError = UndefinedTypeError;
