"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
const eager_import_0 = require("./author.model");
let Post = exports.Post = class Post {
    static _GRAPHQL_METADATA_FACTORY() {
        return { author: { type: () => require("./author.model").Author } };
    }
};
exports.Post = Post = __decorate([
    ObjectType()
], Post);
