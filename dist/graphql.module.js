"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const metadata_scanner_1 = require("@nestjs/core/metadata-scanner");
const apollo_server_express_1 = require("apollo-server-express");
const graphql_constants_1 = require("./graphql.constants");
const graphql_factory_1 = require("./graphql.factory");
const delegates_explorer_service_1 = require("./services/delegates-explorer.service");
const resolvers_explorer_service_1 = require("./services/resolvers-explorer.service");
const scalars_explorer_service_1 = require("./services/scalars-explorer.service");
const extend_util_1 = require("./utils/extend.util");
const merge_defaults_util_1 = require("./utils/merge-defaults.util");
let GraphQLModule = GraphQLModule_1 = class GraphQLModule {
    constructor(options, graphQLFactory) {
        this.options = options;
        this.graphQLFactory = graphQLFactory;
    }
    static forRoot(options = {}) {
        return {
            module: GraphQLModule_1,
            providers: [
                {
                    provide: graphql_constants_1.GRAPHQL_MODULE_OPTIONS,
                    useValue: merge_defaults_util_1.mergeDefaults(options),
                },
            ],
        };
    }
    configure(consumer) {
        const typeDefs = this.graphQLFactory.mergeTypesByPaths(...(this.options.typePaths || []));
        const schema = this.graphQLFactory.createSchema({
            typeDefs: extend_util_1.extend(typeDefs, this.options.typeDefs),
            resolvers: this.options.resolvers,
            schemaDirectives: this.options.schemaDirectives,
            connectors: this.options.connectors,
            logger: this.options.logger,
            allowUndefinedInResolve: this.options.allowUndefinedInResolve,
            resolverValidationOptions: this.options.resolverValidationOptions,
            directiveResolvers: this.options.directiveResolvers,
            parseOptions: this.options.parseOptions,
        });
        if (this.options.graphiQl) {
            consumer
                .apply(apollo_server_express_1.graphiqlExpress(this.options.graphiQl))
                .forRoutes(this.options.graphiQl.path);
        }
        consumer
            .apply(apollo_server_express_1.graphqlExpress(req => ({
            schema,
            rootValue: this.options.rootValueResolver(req),
            context: this.options.contextResolver(req),
            parseOptions: this.options.parseOptions,
            formatError: this.options.formatError,
            logFunction: this.options.logFunction,
            formatParams: this.options.formatParams,
            validationRules: this.options.validationRules,
            formatResponse: this.options.formatResponse,
            fieldResolver: this.options.fieldResolver,
            debug: this.options.debug,
            tracing: this.options.tracing,
            cacheControl: this.options.cacheControl,
        })))
            .forRoutes(this.options.path);
    }
};
GraphQLModule = GraphQLModule_1 = __decorate([
    common_1.Module({
        providers: [
            graphql_factory_1.GraphQLFactory,
            metadata_scanner_1.MetadataScanner,
            resolvers_explorer_service_1.ResolversExplorerService,
            delegates_explorer_service_1.DelegatesExplorerService,
            scalars_explorer_service_1.ScalarsExplorerService,
        ],
        exports: [graphql_factory_1.GraphQLFactory, resolvers_explorer_service_1.ResolversExplorerService],
    }),
    __param(0, common_1.Inject(graphql_constants_1.GRAPHQL_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [Object, graphql_factory_1.GraphQLFactory])
], GraphQLModule);
exports.GraphQLModule = GraphQLModule;
var GraphQLModule_1;
