"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScalarType = void 0;
const graphql_1 = require("graphql");
function bindInstanceContext(instance, funcKey) {
    return instance[funcKey]
        ? instance[funcKey].bind(instance)
        : undefined;
}
function createScalarType(name, instance) {
    return new graphql_1.GraphQLScalarType({
        name,
        description: instance.description,
        parseValue: bindInstanceContext(instance, 'parseValue'),
        serialize: bindInstanceContext(instance, 'serialize'),
        parseLiteral: bindInstanceContext(instance, 'parseLiteral'),
    });
}
exports.createScalarType = createScalarType;
