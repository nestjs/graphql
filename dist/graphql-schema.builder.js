"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLSchemaBuilder = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const load_package_util_1 = require("@nestjs/common/utils/load-package.util");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const graphql_1 = require("graphql");
const path_1 = require("path");
const graphql_constants_1 = require("./graphql.constants");
const graphql_schema_factory_1 = require("./schema-builder/graphql-schema.factory");
const file_system_helper_1 = require("./schema-builder/helpers/file-system.helper");
const services_1 = require("./services");
let GraphQLSchemaBuilder = (() => {
    let GraphQLSchemaBuilder = class GraphQLSchemaBuilder {
        constructor(scalarsExplorerService, gqlSchemaFactory, fileSystemHelper) {
            this.scalarsExplorerService = scalarsExplorerService;
            this.gqlSchemaFactory = gqlSchemaFactory;
            this.fileSystemHelper = fileSystemHelper;
        }
        build(autoSchemaFile, options, resolvers) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const scalarsMap = this.scalarsExplorerService.getScalarsMap();
                try {
                    const buildSchemaOptions = options.buildSchemaOptions || {};
                    return yield this.buildSchema(resolvers, autoSchemaFile, Object.assign(Object.assign({}, buildSchemaOptions), { scalarsMap, schemaDirectives: options.schemaDirectives }));
                }
                catch (err) {
                    if (err && err.details) {
                        console.error(err.details);
                    }
                    throw err;
                }
            });
        }
        buildFederatedSchema(autoSchemaFile, options, resolvers) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const scalarsMap = this.scalarsExplorerService.getScalarsMap();
                try {
                    const buildSchemaOptions = options.buildSchemaOptions || {};
                    return yield this.buildSchema(resolvers, autoSchemaFile, Object.assign(Object.assign({}, buildSchemaOptions), { directives: [
                            ...graphql_1.specifiedDirectives,
                            ...this.loadFederationDirectives(),
                            ...((buildSchemaOptions && buildSchemaOptions.directives) || []),
                        ], scalarsMap, schemaDirectives: options.schemaDirectives, skipCheck: true }));
                }
                catch (err) {
                    if (err && err.details) {
                        console.error(err.details);
                    }
                    throw err;
                }
            });
        }
        buildSchema(resolvers, autoSchemaFile, options = {}) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const schema = yield this.gqlSchemaFactory.create(resolvers, options);
                if (typeof autoSchemaFile !== 'boolean') {
                    const filename = shared_utils_1.isString(autoSchemaFile)
                        ? autoSchemaFile
                        : path_1.resolve(process.cwd(), 'schema.gql');
                    const fileContent = graphql_constants_1.GRAPHQL_SDL_FILE_HEADER + graphql_1.printSchema(schema);
                    yield this.fileSystemHelper.writeFile(filename, fileContent);
                }
                return schema;
            });
        }
        loadFederationDirectives() {
            const { federationDirectives, } = load_package_util_1.loadPackage('@apollo/federation/dist/directives', 'SchemaBuilder', () => require('@apollo/federation/dist/directives'));
            return federationDirectives;
        }
    };
    GraphQLSchemaBuilder = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [services_1.ScalarsExplorerService,
            graphql_schema_factory_1.GraphQLSchemaFactory,
            file_system_helper_1.FileSystemHelper])
    ], GraphQLSchemaBuilder);
    return GraphQLSchemaBuilder;
})();
exports.GraphQLSchemaBuilder = GraphQLSchemaBuilder;
