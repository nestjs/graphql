"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scalar = void 0;
const common_1 = require("@nestjs/common");
const graphql_constants_1 = require("../graphql.constants");
function Scalar(name, typeFunc) {
    return (target, key, descriptor) => {
        common_1.SetMetadata(graphql_constants_1.SCALAR_NAME_METADATA, name)(target, key, descriptor);
        common_1.SetMetadata(graphql_constants_1.SCALAR_TYPE_METADATA, typeFunc)(target, key, descriptor);
    };
}
exports.Scalar = Scalar;
