"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plugin = void 0;
const common_1 = require("@nestjs/common");
const graphql_constants_1 = require("../graphql.constants");
function Plugin() {
    return (target) => {
        common_1.SetMetadata(graphql_constants_1.PLUGIN_METADATA, true)(target);
    };
}
exports.Plugin = Plugin;
