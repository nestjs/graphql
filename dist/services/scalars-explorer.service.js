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
const external_context_creator_1 = require("@nestjs/core/helpers/external-context-creator");
const modules_container_1 = require("@nestjs/core/injector/modules-container");
const metadata_scanner_1 = require("@nestjs/core/metadata-scanner");
const graphql_constants_1 = require("../graphql.constants");
const base_explorer_service_1 = require("./base-explorer.service");
let ScalarsExplorerService = class ScalarsExplorerService extends base_explorer_service_1.BaseExplorerService {
    constructor(modulesContainer, metadataScanner, externalContextCreator) {
        super();
        this.modulesContainer = modulesContainer;
        this.metadataScanner = metadataScanner;
        this.externalContextCreator = externalContextCreator;
    }
    explore() {
        const modules = [...this.modulesContainer.values()].map(module => module.components);
        const scalars = this.flatMap(modules, instance => this.filterScalar(instance));
        console.log(scalars);
        return this.groupMetadata(scalars);
    }
    filterScalar(instance) {
        const scalarName = Reflect.getMetadata(graphql_constants_1.SCALAR_NAME_METADATA, instance.constructor);
        if (!scalarName) {
            return undefined;
        }
        return {
            [scalarName]: instance,
        };
    }
};
ScalarsExplorerService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [modules_container_1.ModulesContainer,
        metadata_scanner_1.MetadataScanner,
        external_context_creator_1.ExternalContextCreator])
], ScalarsExplorerService);
exports.ScalarsExplorerService = ScalarsExplorerService;
