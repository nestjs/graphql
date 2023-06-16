"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Author = void 0;
let Author = exports.Author = class Author {
    static _GRAPHQL_METADATA_FACTORY() {
        return { name: { type: () => String }, email: { type: () => String } };
    }
};
exports.Author = Author = __decorate([
    ObjectType()
], Author);
