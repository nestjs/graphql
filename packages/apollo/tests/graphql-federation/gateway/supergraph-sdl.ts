export const supergraphSdl = `schema
@link(url: "https://specs.apollo.dev/link/v1.0")
@link(url: "https://specs.apollo.dev/join/v0.3", for: EXECUTION)
{
query: Query
mutation: Mutation
}

directive @join__enumValue(graph: join__Graph!) repeatable on ENUM_VALUE

directive @join__field(graph: join__Graph, requires: join__FieldSet, provides: join__FieldSet, type: String, external: Boolean, override: String, usedOverridden: Boolean) repeatable on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

directive @join__graph(name: String!, url: String!) on ENUM_VALUE

directive @join__implements(graph: join__Graph!, interface: String!) repeatable on OBJECT | INTERFACE

directive @join__type(graph: join__Graph!, key: join__FieldSet, extension: Boolean! = false, resolvable: Boolean! = true, isInterfaceObject: Boolean! = false) repeatable on OBJECT | INTERFACE | UNION | ENUM | INPUT_OBJECT | SCALAR

directive @join__unionMember(graph: join__Graph!, member: String!) repeatable on UNION

directive @link(url: String, as: String, for: link__Purpose, import: [link__Import]) repeatable on SCHEMA

scalar Date
@join__type(graph: POSTS)

scalar join__FieldSet

enum join__Graph {
POSTS @join__graph(name: "posts", url: "http://localhost:3002/graphql")
USERS @join__graph(name: "users", url: "http://localhost:3001/graphql")
}

scalar link__Import

enum link__Purpose {
"""
\`SECURITY\` features provide metadata necessary to securely resolve fields.
"""
SECURITY

"""
\`EXECUTION\` features provide metadata necessary for operation execution.
"""
EXECUTION
}

type Mutation
@join__type(graph: POSTS)
{
publishPost(id: ID!, publishDate: Date!): Post
}

type Post
@join__type(graph: POSTS, key: "id")
{
id: ID!
title: String!
body: String!
user: User
publishDate: Date
type: PostType
}

enum PostType
@join__type(graph: POSTS)
{
TEXT @join__enumValue(graph: POSTS)
IMAGE @join__enumValue(graph: POSTS)
}

type Query
@join__type(graph: POSTS)
@join__type(graph: USERS)
{
getPosts(type: PostType): [Post] @join__field(graph: POSTS)
getUser(id: ID!): User @join__field(graph: USERS)
}

type User
@join__type(graph: POSTS, key: "id")
@join__type(graph: USERS, key: "id")
{
id: ID!
posts: [Post] @join__field(graph: POSTS)
name: String! @join__field(graph: USERS)
}`;
