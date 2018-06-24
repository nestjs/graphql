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
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const fs = require("fs");
const glob = require("glob");
const graphql_tools_1 = require("graphql-tools");
const merge_graphql_schemas_1 = require("merge-graphql-schemas");
const delegates_explorer_service_1 = require("./services/delegates-explorer.service");
const resolvers_explorer_service_1 = require("./services/resolvers-explorer.service");
const scalars_explorer_service_1 = require("./services/scalars-explorer.service");
const extend_util_1 = require("./utils/extend.util");
let GraphQLFactory = class GraphQLFactory {
    constructor(resolversExplorerService, delegatesExplorerService, scalarsExplorerService) {
        this.resolversExplorerService = resolversExplorerService;
        this.delegatesExplorerService = delegatesExplorerService;
        this.scalarsExplorerService = scalarsExplorerService;
    }
    createSchema(schemaDefintion = { typeDefs: [] }) {
        const resolvers = extend_util_1.extend(this.scalarsExplorerService.explore(), this.resolversExplorerService.explore());
        return graphql_tools_1.makeExecutableSchema(Object.assign({}, schemaDefintion, { resolvers: extend_util_1.extend(resolvers, schemaDefintion.resolvers), schemaDirectives: extend_util_1.extend(this.scalarsExplorerService.explore(), schemaDefintion.schemaDirectives) }));
    }
    createDelegates() {
        return this.delegatesExplorerService.explore();
    }
    mergeTypesByPaths(...pathsToTypes) {
        return merge_graphql_schemas_1.mergeTypes(...pathsToTypes.map(pattern => this.loadFiles(pattern)));
    }
    loadFiles(pattern) {
        const paths = glob.sync(pattern);
        return paths.map(path => fs.readFileSync(path, 'utf8'));
    }
};
GraphQLFactory = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [resolvers_explorer_service_1.ResolversExplorerService,
        delegates_explorer_service_1.DelegatesExplorerService,
        scalars_explorer_service_1.ScalarsExplorerService])
], GraphQLFactory);
exports.GraphQLFactory = GraphQLFactory;
