"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addClassTypeMetadata = void 0;
const common_1 = require("@nestjs/common");
const graphql_constants_1 = require("../graphql.constants");
function addClassTypeMetadata(target, classType) {
    const decoratorFactory = common_1.SetMetadata(graphql_constants_1.CLASS_TYPE_METADATA, classType);
    decoratorFactory(target);
}
exports.addClassTypeMetadata = addClassTypeMetadata;
