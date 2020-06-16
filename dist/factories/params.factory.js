"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GqlParamsFactory = void 0;
const gql_paramtype_enum_1 = require("../enums/gql-paramtype.enum");
class GqlParamsFactory {
    exchangeKeyForValue(type, data, args) {
        if (!args) {
            return null;
        }
        switch (type) {
            case gql_paramtype_enum_1.GqlParamtype.ROOT:
                return args[0];
            case gql_paramtype_enum_1.GqlParamtype.ARGS:
                return data && args[1] ? args[1][data] : args[1];
            case gql_paramtype_enum_1.GqlParamtype.CONTEXT:
                return data && args[2] ? args[2][data] : args[2];
            case gql_paramtype_enum_1.GqlParamtype.INFO:
                return data && args[3] ? args[3][data] : args[3];
            default:
                return null;
        }
    }
}
exports.GqlParamsFactory = GqlParamsFactory;
