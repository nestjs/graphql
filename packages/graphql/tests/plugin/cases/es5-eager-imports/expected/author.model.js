"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Author = void 0;
let Author = class Author {
    static _GRAPHQL_METADATA_FACTORY() {
        return { name: { type: () => String }, email: { type: () => String } };
    }
};
Author = __decorate([
    ObjectType()
], Author);
exports.Author = Author;
