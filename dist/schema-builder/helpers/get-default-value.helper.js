"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultValue = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const default_values_conflict_error_1 = require("../errors/default-values-conflict.error");
function getDefaultValue(instance, options, key, typeName) {
    const initializerValue = instance[key];
    if (shared_utils_1.isUndefined(options.defaultValue)) {
        return initializerValue;
    }
    if (options.defaultValue !== initializerValue &&
        !shared_utils_1.isUndefined(initializerValue)) {
        throw new default_values_conflict_error_1.DefaultValuesConflictError(typeName, key, options.defaultValue, initializerValue);
    }
    return options.defaultValue;
}
exports.getDefaultValue = getDefaultValue;
