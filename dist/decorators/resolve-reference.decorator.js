"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolveReference = void 0;
const common_1 = require("@nestjs/common");
const federation_constants_1 = require("../federation/federation.constants");
function ResolveReference() {
    return (target, key, descriptor) => {
        common_1.SetMetadata(federation_constants_1.RESOLVER_REFERENCE_METADATA, true)(target, key, descriptor);
    };
}
exports.ResolveReference = ResolveReference;
