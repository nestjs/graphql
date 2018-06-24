"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const extend_util_1 = require("./extend.util");
const defaultOptions = {
    path: '/graphql',
    rootValueResolver: (req) => req,
    typePaths: ['**/*.graphql'],
    contextResolver: (req) => undefined,
    graphiQl: {
        endpointURL: '/graphql',
        path: '/graphiql'
    }
};
function mergeDefaults(options, defaults = defaultOptions) {
    const graphiQl = extend_util_1.extend(options.graphiQl, defaults.graphiQl);
    return Object.assign({}, defaults, options, { graphiQl });
}
exports.mergeDefaults = mergeDefaults;
