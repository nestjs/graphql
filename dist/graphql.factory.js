'use strict';
var __decorate =
  (this && this.__decorate) ||
  function(decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
var __metadata =
  (this && this.__metadata) ||
  function(k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v);
  };
Object.defineProperty(exports, '__esModule', { value: true });
const glob = require('glob');
const fs = require('fs');
const common_1 = require('@nestjs/common');
const graphql_tools_1 = require('graphql-tools');
const merge_graphql_schemas_1 = require('merge-graphql-schemas');
const resolvers_explorer_service_1 = require('./resolvers-explorer.service');
let GraphQLFactory = class GraphQLFactory {
  constructor(resolversExplorerService) {
    this.resolversExplorerService = resolversExplorerService;
  }
  createSchema(schemaDefintion = { typeDefs: [] }) {
    return graphql_tools_1.makeExecutableSchema(
      Object.assign({}, schemaDefintion, {
        resolvers: Object.assign(
          {},
          this.resolversExplorerService.explore(),
          schemaDefintion.resolvers || {},
        ),
      }),
    );
  }
  createDelegates() {
    return this.resolversExplorerService.exploreDelegates();
  }
  mergeTypesByPaths(...pathsToTypes) {
    return merge_graphql_schemas_1.mergeTypes(
      ...pathsToTypes.map(pattern => this.loadFiles(pattern)),
    );
  }
  loadFiles(pattern) {
    const paths = glob.sync(pattern);
    return paths.map(path => fs.readFileSync(path, 'utf8'));
  }
};
GraphQLFactory = __decorate(
  [
    common_1.Injectable(),
    __metadata('design:paramtypes', [
      resolvers_explorer_service_1.ResolversExplorerService,
    ]),
  ],
  GraphQLFactory,
);
exports.GraphQLFactory = GraphQLFactory;
