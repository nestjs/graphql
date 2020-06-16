"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeMapperSevice = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const graphql_1 = require("graphql");
const scalars_1 = require("../../scalars");
const default_nullable_conflict_error_1 = require("../errors/default-nullable-conflict.error");
const invalid_nullable_option_error_1 = require("../errors/invalid-nullable-option.error");
let TypeMapperSevice = (() => {
    let TypeMapperSevice = class TypeMapperSevice {
        mapToScalarType(typeRef, scalarsMap = [], dateScalarMode = 'isoDate') {
            if (typeRef instanceof graphql_1.GraphQLScalarType) {
                return typeRef;
            }
            const scalarHost = scalarsMap.find((item) => item.type === typeRef);
            if (scalarHost) {
                return scalarHost.scalar;
            }
            const dateScalar = dateScalarMode === 'timestamp' ? scalars_1.GraphQLTimestamp : scalars_1.GraphQLISODateTime;
            const typeScalarMapping = new Map([
                [String, graphql_1.GraphQLString],
                [Number, graphql_1.GraphQLFloat],
                [Boolean, graphql_1.GraphQLBoolean],
                [Date, dateScalar],
            ]);
            return typeScalarMapping.get(typeRef);
        }
        mapToGqlType(hostType, typeRef, options, isInputTypeCtx) {
            this.validateTypeOptions(hostType, options);
            let graphqlType = typeRef;
            if (options.isArray) {
                graphqlType = this.mapToGqlList(graphqlType, options.arrayDepth, this.hasArrayOptions(options));
            }
            let isNotNullable;
            if (isInputTypeCtx) {
                isNotNullable =
                    shared_utils_1.isUndefined(options.defaultValue) &&
                        (!options.nullable || options.nullable === 'items');
            }
            else {
                isNotNullable = !options.nullable || options.nullable === 'items';
            }
            return isNotNullable
                ? new graphql_1.GraphQLNonNull(graphqlType)
                : graphqlType;
        }
        validateTypeOptions(hostType, options) {
            if (!options.isArray && this.hasArrayOptions(options)) {
                throw new invalid_nullable_option_error_1.InvalidNullableOptionError(hostType, options.nullable);
            }
            const isNotNullable = options.nullable === 'items';
            if (!shared_utils_1.isUndefined(options.defaultValue) && isNotNullable) {
                throw new default_nullable_conflict_error_1.DefaultNullableConflictError(hostType, options.defaultValue, options.nullable);
            }
            return true;
        }
        mapToGqlList(targetType, depth, nullable) {
            const targetTypeNonNull = nullable
                ? targetType
                : new graphql_1.GraphQLNonNull(targetType);
            if (depth === 0) {
                return targetType;
            }
            return this.mapToGqlList(new graphql_1.GraphQLList(targetTypeNonNull), depth - 1, nullable);
        }
        hasArrayOptions(options) {
            return options.nullable === 'items' || options.nullable === 'itemsAndList';
        }
    };
    TypeMapperSevice = tslib_1.__decorate([
        common_1.Injectable()
    ], TypeMapperSevice);
    return TypeMapperSevice;
})();
exports.TypeMapperSevice = TypeMapperSevice;
