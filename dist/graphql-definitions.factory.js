"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLDefinitionsFactory = void 0;
const tslib_1 = require("tslib");
const load_package_util_1 = require("@nestjs/common/utils/load-package.util");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const apollo_server_core_1 = require("apollo-server-core");
const chokidar = require("chokidar");
const graphql_1 = require("graphql");
const graphql_tools_1 = require("graphql-tools");
const graphql_ast_explorer_1 = require("./graphql-ast.explorer");
const graphql_types_loader_1 = require("./graphql-types.loader");
const utils_1 = require("./utils");
class GraphQLDefinitionsFactory {
    constructor() {
        this.gqlAstExplorer = new graphql_ast_explorer_1.GraphQLAstExplorer();
        this.gqlTypesLoader = new graphql_types_loader_1.GraphQLTypesLoader();
    }
    generate(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const isDebugEnabled = !(options && options.debug === false);
            const typePathsExists = options.typePaths && !shared_utils_1.isEmpty(options.typePaths);
            if (!typePathsExists) {
                throw new Error(`"typePaths" property cannot be empty.`);
            }
            const isFederation = options && options.federation;
            const definitionsGeneratorOptions = {
                emitTypenameField: options.emitTypenameField,
                skipResolverArgs: options.skipResolverArgs,
            };
            if (options.watch) {
                this.printMessage('GraphQL factory is watching your files...', isDebugEnabled);
                const watcher = chokidar.watch(options.typePaths);
                watcher.on('change', (file) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.printMessage(`[${new Date().toLocaleTimeString()}] "${file}" has been changed.`, isDebugEnabled);
                    yield this.exploreAndEmit(options.typePaths, options.path, options.outputAs, isFederation, isDebugEnabled, definitionsGeneratorOptions);
                }));
            }
            yield this.exploreAndEmit(options.typePaths, options.path, options.outputAs, isFederation, isDebugEnabled, definitionsGeneratorOptions);
        });
    }
    exploreAndEmit(typePaths, path, outputAs, isFederation, isDebugEnabled, definitionsGeneratorOptions = {}) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (isFederation) {
                return this.exploreAndEmitFederation(typePaths, path, outputAs, isDebugEnabled, definitionsGeneratorOptions);
            }
            return this.exploreAndEmitRegular(typePaths, path, outputAs, isDebugEnabled, definitionsGeneratorOptions);
        });
    }
    exploreAndEmitFederation(typePaths, path, outputAs, isDebugEnabled, definitionsGeneratorOptions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const typeDefs = yield this.gqlTypesLoader.mergeTypesByPaths(typePaths);
            const { buildFederatedSchema, printSchema, } = load_package_util_1.loadPackage('@apollo/federation', 'ApolloFederation', () => require('@apollo/federation'));
            const schema = buildFederatedSchema([
                {
                    typeDefs: apollo_server_core_1.gql `
          ${typeDefs}
        `,
                    resolvers: {},
                },
            ]);
            const tsFile = yield this.gqlAstExplorer.explore(apollo_server_core_1.gql `
        ${printSchema(schema)}
      `, path, outputAs, definitionsGeneratorOptions);
            yield tsFile.save();
            this.printMessage(`[${new Date().toLocaleTimeString()}] The definitions have been updated.`, isDebugEnabled);
        });
    }
    exploreAndEmitRegular(typePaths, path, outputAs, isDebugEnabled, definitionsGeneratorOptions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const typeDefs = yield this.gqlTypesLoader.mergeTypesByPaths(typePaths || []);
            if (!typeDefs) {
                throw new Error(`"typeDefs" property cannot be null.`);
            }
            let schema = graphql_tools_1.makeExecutableSchema({
                typeDefs,
                resolverValidationOptions: { allowResolversNotInSchema: true },
            });
            schema = utils_1.removeTempField(schema);
            const tsFile = yield this.gqlAstExplorer.explore(apollo_server_core_1.gql `
        ${graphql_1.printSchema(schema)}
      `, path, outputAs, definitionsGeneratorOptions);
            yield tsFile.save();
            this.printMessage(`[${new Date().toLocaleTimeString()}] The definitions have been updated.`, isDebugEnabled);
        });
    }
    printMessage(text, isEnabled) {
        isEnabled && console.log(text);
    }
}
exports.GraphQLDefinitionsFactory = GraphQLDefinitionsFactory;
