"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLTimestamp = void 0;
const graphql_1 = require("graphql");
exports.GraphQLTimestamp = new graphql_1.GraphQLScalarType({
    name: 'Timestamp',
    description: '`Date` type as integer. Type represents date and time as number of milliseconds from start of UNIX epoch.',
    serialize(value) {
        return value instanceof Date ? value.getTime() : null;
    },
    parseValue(value) {
        try {
            return value !== null ? new Date(value) : null;
        }
        catch (_a) {
            return null;
        }
    },
    parseLiteral(ast) {
        if (ast.kind === graphql_1.Kind.INT) {
            const num = parseInt(ast.value, 10);
            return new Date(num);
        }
        else if (ast.kind === graphql_1.Kind.STRING) {
            return this.parseValue(ast.value);
        }
        return null;
    },
});
