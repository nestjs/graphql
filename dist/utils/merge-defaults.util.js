"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeDefaults = void 0;
const tslib_1 = require("tslib");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const defaultOptions = {
    path: '/graphql',
    fieldResolverEnhancers: [],
};
function mergeDefaults(options, defaults = defaultOptions) {
    const moduleOptions = Object.assign(Object.assign({}, defaults), options);
    if (!moduleOptions.context) {
        moduleOptions.context = ({ req }) => ({ req });
    }
    else if (shared_utils_1.isFunction(moduleOptions.context)) {
        moduleOptions.context = (...args) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const ctx = yield options.context(...args);
            const { req } = args[0];
            return assignReqProperty(ctx, req);
        });
    }
    else {
        moduleOptions.context = ({ req }) => {
            return assignReqProperty(options.context, req);
        };
    }
    return moduleOptions;
}
exports.mergeDefaults = mergeDefaults;
function assignReqProperty(ctx, req) {
    if (!ctx) {
        return { req };
    }
    if (typeof ctx !== 'object' ||
        (ctx && ctx.req && typeof ctx.req === 'object')) {
        return ctx;
    }
    ctx.req = req;
    return ctx;
}
