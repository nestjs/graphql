"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parent = void 0;
const gql_paramtype_enum_1 = require("../enums/gql-paramtype.enum");
const param_utils_1 = require("./param.utils");
exports.Parent = param_utils_1.createGqlParamDecorator(gql_paramtype_enum_1.GqlParamtype.ROOT);
