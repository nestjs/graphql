import * as eager_import_0 from "./author.model.js";
let Comment = class Comment {
    body;
    static _GRAPHQL_METADATA_FACTORY() {
        return { body: { type: () => String } };
    }
};
Comment = __decorate([
    ObjectType()
], Comment);
export { Comment };
let Post = class Post {
    author;
    authors;
    comments;
    static _GRAPHQL_METADATA_FACTORY() {
        return { author: { type: () => eager_import_0.Author }, authors: { type: () => [eager_import_0.Author] }, comments: { type: () => [Comment] } };
    }
};
Post = __decorate([
    ObjectType()
], Post);
export { Post };
