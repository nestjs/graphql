"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
class BaseExplorerService {
    flatMap(modules, callback) {
        return lodash_1.flattenDeep(modules.map(module => [...module.values()].map(({ instance }) => callback(instance)))).filter(lodash_1.identity);
    }
    groupMetadata(resolvers) {
        const groupByType = lodash_1.groupBy(resolvers, metadata => metadata.type);
        return lodash_1.mapValues(groupByType, resolversArr => resolversArr.reduce((prev, curr) => {
            return Object.assign({}, prev, { [curr.name]: curr.callback });
        }, {}));
    }
}
exports.BaseExplorerService = BaseExplorerService;
