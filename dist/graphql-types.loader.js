"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLTypesLoader = void 0;
const tslib_1 = require("tslib");
const merge_1 = require("@graphql-tools/merge");
const common_1 = require("@nestjs/common");
const glob = require("fast-glob");
const fs = require("fs");
const lodash_1 = require("lodash");
const util = require("util");
const normalize = require('normalize-path');
const readFile = util.promisify(fs.readFile);
let GraphQLTypesLoader = (() => {
    let GraphQLTypesLoader = class GraphQLTypesLoader {
        mergeTypesByPaths(paths) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (!paths || paths.length === 0) {
                    return null;
                }
                const types = yield this.getTypesFromPaths(paths);
                const flatTypes = lodash_1.flatten(types);
                return merge_1.mergeTypeDefs(flatTypes, {
                    throwOnConflict: true,
                    commentDescriptions: true,
                    reverseDirectives: true,
                });
            });
        }
        getTypesFromPaths(paths) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                paths = util.isArray(paths)
                    ? paths.map((path) => normalize(path))
                    : normalize(paths);
                const filePaths = yield glob(paths, {
                    ignore: ['node_modules'],
                });
                const fileContentsPromises = filePaths.sort().map((filePath) => {
                    return readFile(filePath.toString(), 'utf8');
                });
                return Promise.all(fileContentsPromises);
            });
        }
    };
    GraphQLTypesLoader = tslib_1.__decorate([
        common_1.Injectable()
    ], GraphQLTypesLoader);
    return GraphQLTypesLoader;
})();
exports.GraphQLTypesLoader = GraphQLTypesLoader;
