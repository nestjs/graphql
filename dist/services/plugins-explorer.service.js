"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginsExplorerService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const modules_container_1 = require("@nestjs/core/injector/modules-container");
const graphql_constants_1 = require("../graphql.constants");
const base_explorer_service_1 = require("./base-explorer.service");
let PluginsExplorerService = (() => {
    let PluginsExplorerService = class PluginsExplorerService extends base_explorer_service_1.BaseExplorerService {
        constructor(modulesContainer, gqlOptions) {
            super();
            this.modulesContainer = modulesContainer;
            this.gqlOptions = gqlOptions;
        }
        explore() {
            const modules = this.getModules(this.modulesContainer, this.gqlOptions.include || []);
            return this.flatMap(modules, instance => this.filterPlugins(instance));
        }
        filterPlugins(wrapper) {
            const { instance } = wrapper;
            if (!instance) {
                return undefined;
            }
            const metadata = Reflect.getMetadata(graphql_constants_1.PLUGIN_METADATA, instance.constructor);
            return metadata ? instance : undefined;
        }
    };
    PluginsExplorerService = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__param(1, common_1.Inject(graphql_constants_1.GRAPHQL_MODULE_OPTIONS)),
        tslib_1.__metadata("design:paramtypes", [modules_container_1.ModulesContainer, Object])
    ], PluginsExplorerService);
    return PluginsExplorerService;
})();
exports.PluginsExplorerService = PluginsExplorerService;
