"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLISODateTime = void 0;
const graphql_1 = require("graphql");
exports.GraphQLISODateTime = new graphql_1.GraphQLScalarType({
    name: 'DateTime',
    description: 'A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format.',
    parseValue(value) {
        return new Date(value);
    },
    serialize(value) {
        return value instanceof Date ? value.toISOString() : null;
    },
    parseLiteral(ast) {
        return ast.kind === graphql_1.Kind.STRING ? new Date(ast.value) : null;
    },
});
