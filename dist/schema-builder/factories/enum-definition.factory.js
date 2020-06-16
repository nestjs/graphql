"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumDefinitionFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const graphql_1 = require("graphql");
let EnumDefinitionFactory = (() => {
    let EnumDefinitionFactory = class EnumDefinitionFactory {
        create(metadata) {
            const enumValues = this.getEnumValues(metadata.ref);
            return {
                enumRef: metadata.ref,
                type: new graphql_1.GraphQLEnumType({
                    name: metadata.name,
                    description: metadata.description,
                    values: Object.keys(enumValues).reduce((prevValue, key) => {
                        prevValue[key] = {
                            value: enumValues[key],
                        };
                        return prevValue;
                    }, {}),
                }),
            };
        }
        getEnumValues(enumObject) {
            const enumKeys = Object.keys(enumObject).filter(key => isNaN(parseInt(key, 10)));
            return enumKeys.reduce((prev, nextKey) => {
                prev[nextKey] = enumObject[nextKey];
                return prev;
            }, {});
        }
    };
    EnumDefinitionFactory = tslib_1.__decorate([
        common_1.Injectable()
    ], EnumDefinitionFactory);
    return EnumDefinitionFactory;
})();
exports.EnumDefinitionFactory = EnumDefinitionFactory;
