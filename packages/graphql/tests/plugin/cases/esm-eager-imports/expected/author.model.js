let Author = class Author {
    name;
    email;
    static _GRAPHQL_METADATA_FACTORY() {
        return { name: { type: () => String }, email: { type: () => String } };
    }
};
Author = __decorate([
    ObjectType()
], Author);
export { Author };
