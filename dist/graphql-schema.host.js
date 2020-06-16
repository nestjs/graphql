"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLSchemaHost = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
let GraphQLSchemaHost = (() => {
    let GraphQLSchemaHost = class GraphQLSchemaHost {
        set schema(schemaRef) {
            this._schema = schemaRef;
        }
        get schema() {
            if (!this._schema) {
                throw new Error('GraphQL schema has not yet been created. ' +
                    'Make sure to call the "GraphQLSchemaHost#schema" getter when the application is already initialized (after the "onModuleInit" hook triggered by either "app.listen()" or "app.init()" method).');
            }
            return this._schema;
        }
    };
    GraphQLSchemaHost = tslib_1.__decorate([
        common_1.Injectable()
    ], GraphQLSchemaHost);
    return GraphQLSchemaHost;
})();
exports.GraphQLSchemaHost = GraphQLSchemaHost;
