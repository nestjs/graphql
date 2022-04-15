export const printedSchemaSnapshot = `# ------------------------------------------------------
# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
# ------------------------------------------------------

directive @cacheControl(maxAge: Int, scope: CacheControlScope, inheritMaxAge: Boolean) on FIELD_DEFINITION | OBJECT | INTERFACE

interface IRecipe {
  id: ID!
  title: String!
  externalField: String!
}

type Post {
  id: ID!
  title: String!
  authorId: Int!
}

type Recipe implements IRecipe {
  id: ID!
  title: String!
  externalField: String!
  description: String!
}

type Query {
  findPost(id: Float!): Post!
  getPosts: [Post!]!
  search: [FederationSearchResultUnion!]! @deprecated(reason: "test")
  recipe: IRecipe!
}

"""Search result description"""
union FederationSearchResultUnion = Post | User

type User {
  id: ID!
  posts: [Post!]!
}

enum CacheControlScope {
  PUBLIC
  PRIVATE
}
`;
