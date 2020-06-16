"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const load_package_util_1 = require("@nestjs/common/utils/load-package.util");
const core_1 = require("@nestjs/core");
const metadata_scanner_1 = require("@nestjs/core/metadata-scanner");
const graphql_1 = require("graphql");
const graphql_ast_explorer_1 = require("./graphql-ast.explorer");
const graphql_schema_builder_1 = require("./graphql-schema.builder");
const graphql_schema_host_1 = require("./graphql-schema.host");
const graphql_types_loader_1 = require("./graphql-types.loader");
const graphql_constants_1 = require("./graphql.constants");
const graphql_factory_1 = require("./graphql.factory");
const schema_builder_module_1 = require("./schema-builder/schema-builder.module");
const services_1 = require("./services");
const utils_1 = require("./utils");
let GraphQLModule = (() => {
    var GraphQLModule_1;
    let GraphQLModule = GraphQLModule_1 = class GraphQLModule {
        constructor(httpAdapterHost, options, graphqlFactory, graphqlTypesLoader, applicationConfig) {
            this.httpAdapterHost = httpAdapterHost;
            this.options = options;
            this.graphqlFactory = graphqlFactory;
            this.graphqlTypesLoader = graphqlTypesLoader;
            this.applicationConfig = applicationConfig;
        }
        static forRoot(options = {}) {
            options = utils_1.mergeDefaults(options);
            return {
                module: GraphQLModule_1,
                providers: [
                    {
                        provide: graphql_constants_1.GRAPHQL_MODULE_OPTIONS,
                        useValue: options,
                    },
                ],
            };
        }
        static forRootAsync(options) {
            return {
                module: GraphQLModule_1,
                imports: options.imports,
                providers: [
                    ...this.createAsyncProviders(options),
                    {
                        provide: graphql_constants_1.GRAPHQL_MODULE_ID,
                        useValue: utils_1.generateString(),
                    },
                ],
            };
        }
        static createAsyncProviders(options) {
            if (options.useExisting || options.useFactory) {
                return [this.createAsyncOptionsProvider(options)];
            }
            return [
                this.createAsyncOptionsProvider(options),
                {
                    provide: options.useClass,
                    useClass: options.useClass,
                },
            ];
        }
        static createAsyncOptionsProvider(options) {
            if (options.useFactory) {
                return {
                    provide: graphql_constants_1.GRAPHQL_MODULE_OPTIONS,
                    useFactory: (...args) => tslib_1.__awaiter(this, void 0, void 0, function* () { return utils_1.mergeDefaults(yield options.useFactory(...args)); }),
                    inject: options.inject || [],
                };
            }
            return {
                provide: graphql_constants_1.GRAPHQL_MODULE_OPTIONS,
                useFactory: (optionsFactory) => tslib_1.__awaiter(this, void 0, void 0, function* () { return utils_1.mergeDefaults(yield optionsFactory.createGqlOptions()); }),
                inject: [options.useExisting || options.useClass],
            };
        }
        onModuleInit() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (!this.httpAdapterHost) {
                    return;
                }
                const httpAdapter = this.httpAdapterHost.httpAdapter;
                if (!httpAdapter) {
                    return;
                }
                const typeDefs = (yield this.graphqlTypesLoader.mergeTypesByPaths(this.options.typePaths)) || [];
                const mergedTypeDefs = utils_1.extend(typeDefs, this.options.typeDefs);
                const apolloOptions = yield this.graphqlFactory.mergeOptions(Object.assign(Object.assign({}, this.options), { typeDefs: mergedTypeDefs }));
                if (this.options.definitions && this.options.definitions.path) {
                    yield this.graphqlFactory.generateDefinitions(graphql_1.printSchema(apolloOptions.schema), this.options);
                }
                this.registerGqlServer(apolloOptions);
                if (this.options.installSubscriptionHandlers) {
                    this.apolloServer.installSubscriptionHandlers(httpAdapter.getHttpServer());
                }
            });
        }
        registerGqlServer(apolloOptions) {
            const httpAdapter = this.httpAdapterHost.httpAdapter;
            const platformName = httpAdapter.getType();
            if (platformName === 'express') {
                this.registerExpress(apolloOptions);
            }
            else if (platformName === 'fastify') {
                this.registerFastify(apolloOptions);
            }
            else {
                throw new Error(`No support for current HttpAdapter: ${platformName}`);
            }
        }
        registerExpress(apolloOptions) {
            const { ApolloServer } = load_package_util_1.loadPackage('apollo-server-express', 'GraphQLModule', () => require('apollo-server-express'));
            const path = this.getNormalizedPath(apolloOptions);
            const { disableHealthCheck, onHealthCheck, cors, bodyParserConfig, } = this.options;
            const httpAdapter = this.httpAdapterHost.httpAdapter;
            const app = httpAdapter.getInstance();
            const apolloServer = new ApolloServer(apolloOptions);
            apolloServer.applyMiddleware({
                app,
                path,
                disableHealthCheck,
                onHealthCheck,
                cors,
                bodyParserConfig,
            });
            this.apolloServer = apolloServer;
        }
        registerFastify(apolloOptions) {
            const { ApolloServer } = load_package_util_1.loadPackage('apollo-server-fastify', 'GraphQLModule', () => require('apollo-server-fastify'));
            const httpAdapter = this.httpAdapterHost.httpAdapter;
            const app = httpAdapter.getInstance();
            const path = this.getNormalizedPath(apolloOptions);
            const apolloServer = new ApolloServer(apolloOptions);
            const { disableHealthCheck, onHealthCheck, cors, bodyParserConfig, } = this.options;
            app.register(apolloServer.createHandler({
                disableHealthCheck,
                onHealthCheck,
                cors,
                bodyParserConfig,
                path,
            }));
            this.apolloServer = apolloServer;
        }
        getNormalizedPath(apolloOptions) {
            const prefix = this.applicationConfig.getGlobalPrefix();
            const useGlobalPrefix = prefix && this.options.useGlobalPrefix;
            const gqlOptionsPath = utils_1.normalizeRoutePath(apolloOptions.path);
            return useGlobalPrefix
                ? utils_1.normalizeRoutePath(prefix) + gqlOptionsPath
                : gqlOptionsPath;
        }
    };
    GraphQLModule = GraphQLModule_1 = tslib_1.__decorate([
        common_1.Module({
            imports: [schema_builder_module_1.GraphQLSchemaBuilderModule],
            providers: [
                graphql_factory_1.GraphQLFactory,
                metadata_scanner_1.MetadataScanner,
                services_1.ResolversExplorerService,
                services_1.ScalarsExplorerService,
                services_1.PluginsExplorerService,
                graphql_ast_explorer_1.GraphQLAstExplorer,
                graphql_types_loader_1.GraphQLTypesLoader,
                graphql_schema_builder_1.GraphQLSchemaBuilder,
                graphql_schema_host_1.GraphQLSchemaHost,
            ],
            exports: [graphql_types_loader_1.GraphQLTypesLoader, graphql_ast_explorer_1.GraphQLAstExplorer, graphql_schema_host_1.GraphQLSchemaHost],
        }),
        tslib_1.__param(1, common_1.Inject(graphql_constants_1.GRAPHQL_MODULE_OPTIONS)),
        tslib_1.__metadata("design:paramtypes", [core_1.HttpAdapterHost, Object, graphql_factory_1.GraphQLFactory,
            graphql_types_loader_1.GraphQLTypesLoader,
            core_1.ApplicationConfig])
    ], GraphQLModule);
    return GraphQLModule;
})();
exports.GraphQLModule = GraphQLModule;
