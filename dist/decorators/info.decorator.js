"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Info = void 0;
require("reflect-metadata");
const gql_paramtype_enum_1 = require("../enums/gql-paramtype.enum");
const param_utils_1 = require("./param.utils");
function Info(...pipes) {
    return param_utils_1.createGqlPipesParamDecorator(gql_paramtype_enum_1.GqlParamtype.INFO)(undefined, ...pipes);
}
exports.Info = Info;
