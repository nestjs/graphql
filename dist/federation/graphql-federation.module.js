"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLFederationModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const load_package_util_1 = require("@nestjs/common/utils/load-package.util");
const core_1 = require("@nestjs/core");
const metadata_scanner_1 = require("@nestjs/core/metadata-scanner");
const graphql_ast_explorer_1 = require("../graphql-ast.explorer");
const graphql_schema_builder_1 = require("../graphql-schema.builder");
const graphql_schema_host_1 = require("../graphql-schema.host");
const graphql_types_loader_1 = require("../graphql-types.loader");
const graphql_constants_1 = require("../graphql.constants");
const graphql_factory_1 = require("../graphql.factory");
const schema_builder_module_1 = require("../schema-builder/schema-builder.module");
const services_1 = require("../services");
const utils_1 = require("../utils");
const graphql_federation_factory_1 = require("./graphql-federation.factory");
let GraphQLFederationModule = (() => {
    var GraphQLFederationModule_1;
    let GraphQLFederationModule = GraphQLFederationModule_1 = class GraphQLFederationModule {
        constructor(httpAdapterHost, options, graphqlFederationFactory, graphqlTypesLoader, graphqlFactory, applicationConfig) {
            this.httpAdapterHost = httpAdapterHost;
            this.options = options;
            this.graphqlFederationFactory = graphqlFederationFactory;
            this.graphqlTypesLoader = graphqlTypesLoader;
            this.graphqlFactory = graphqlFactory;
            this.applicationConfig = applicationConfig;
        }
        static forRoot(options = {}) {
            options = utils_1.mergeDefaults(options);
            return {
                module: GraphQLFederationModule_1,
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
                module: GraphQLFederationModule_1,
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
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                };
            }
            return {
                provide: graphql_constants_1.GRAPHQL_MODULE_OPTIONS,
                useFactory: (optionsFactory) => optionsFactory.createGqlOptions(),
                inject: [options.useExisting || options.useClass],
            };
        }
        onModuleInit() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (!this.httpAdapterHost || !this.httpAdapterHost.httpAdapter) {
                    return;
                }
                const { printSchema } = load_package_util_1.loadPackage('@apollo/federation', 'ApolloFederation', () => require('@apollo/federation'));
                const { typePaths } = this.options;
                const typeDefs = (yield this.graphqlTypesLoader.mergeTypesByPaths(typePaths)) || [];
                const mergedTypeDefs = utils_1.extend(typeDefs, this.options.typeDefs);
                const apolloOptions = yield this.graphqlFederationFactory.mergeOptions(Object.assign(Object.assign({}, this.options), { typeDefs: mergedTypeDefs }));
                if (this.options.definitions && this.options.definitions.path) {
                    yield this.graphqlFactory.generateDefinitions(printSchema(apolloOptions.schema), this.options);
                }
                this.registerGqlServer(apolloOptions);
                if (this.options.installSubscriptionHandlers) {
                    throw new Error('No support for subscriptions yet when using Apollo Federation');
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
            const { ApolloServer, SchemaDirectiveVisitor, } = load_package_util_1.loadPackage('apollo-server-express', 'GraphQLModule', () => require('apollo-server-express'));
            const { disableHealthCheck, onHealthCheck, cors, bodyParserConfig, } = this.options;
            const app = this.httpAdapterHost.httpAdapter.getInstance();
            const path = this.getNormalizedPath(apolloOptions);
            if (apolloOptions.schemaDirectives) {
                SchemaDirectiveVisitor.visitSchemaDirectives(apolloOptions.schema, apolloOptions.schemaDirectives);
            }
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
            const { ApolloServer, SchemaDirectiveVisitor, } = load_package_util_1.loadPackage('apollo-server-fastify', 'GraphQLModule', () => require('apollo-server-fastify'));
            const httpAdapter = this.httpAdapterHost.httpAdapter;
            const app = httpAdapter.getInstance();
            const path = this.getNormalizedPath(apolloOptions);
            if (apolloOptions.schemaDirectives) {
                SchemaDirectiveVisitor.visitSchemaDirectives(apolloOptions.schema, apolloOptions.schemaDirectives);
            }
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
    GraphQLFederationModule = GraphQLFederationModule_1 = tslib_1.__decorate([
        common_1.Module({
            imports: [schema_builder_module_1.GraphQLSchemaBuilderModule],
            providers: [
                graphql_federation_factory_1.GraphQLFederationFactory,
                graphql_factory_1.GraphQLFactory,
                metadata_scanner_1.MetadataScanner,
                services_1.ResolversExplorerService,
                services_1.PluginsExplorerService,
                services_1.ScalarsExplorerService,
                graphql_ast_explorer_1.GraphQLAstExplorer,
                graphql_types_loader_1.GraphQLTypesLoader,
                graphql_schema_builder_1.GraphQLSchemaBuilder,
                graphql_schema_host_1.GraphQLSchemaHost,
            ],
            exports: [graphql_schema_host_1.GraphQLSchemaHost, graphql_types_loader_1.GraphQLTypesLoader, graphql_ast_explorer_1.GraphQLAstExplorer],
        }),
        tslib_1.__param(0, common_1.Optional()),
        tslib_1.__param(1, common_1.Inject(graphql_constants_1.GRAPHQL_MODULE_OPTIONS)),
        tslib_1.__metadata("design:paramtypes", [core_1.HttpAdapterHost, Object, graphql_federation_factory_1.GraphQLFederationFactory,
            graphql_types_loader_1.GraphQLTypesLoader,
            graphql_factory_1.GraphQLFactory,
            core_1.ApplicationConfig])
    ], GraphQLFederationModule);
    return GraphQLFederationModule;
})();
exports.GraphQLFederationModule = GraphQLFederationModule;
