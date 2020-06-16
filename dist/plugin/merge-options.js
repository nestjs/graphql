"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePluginOptions = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const defaultOptions = {
    typeFileNameSuffix: ['.input.ts', '.args.ts', '.entity.ts', '.model.ts'],
};
exports.mergePluginOptions = (options = {}) => {
    if (shared_utils_1.isString(options.typeFileNameSuffix)) {
        options.typeFileNameSuffix = [options.typeFileNameSuffix];
    }
    return Object.assign(Object.assign({}, defaultOptions), options);
};
