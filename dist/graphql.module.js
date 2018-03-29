"use strict";
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
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const metadata_scanner_1 = require("@nestjs/core/metadata-scanner");
const graphql_factory_1 = require("./graphql.factory");
const resolvers_explorer_service_1 = require("./resolvers-explorer.service");
let GraphQLModule = class GraphQLModule {};
GraphQLModule = __decorate(
  [
    common_1.Module({
      providers: [
        graphql_factory_1.GraphQLFactory,
        metadata_scanner_1.MetadataScanner,
        resolvers_explorer_service_1.ResolversExplorerService
      ],
      exports: [
        graphql_factory_1.GraphQLFactory,
        resolvers_explorer_service_1.ResolversExplorerService
      ]
    })
  ],
  GraphQLModule
);
exports.GraphQLModule = GraphQLModule;
