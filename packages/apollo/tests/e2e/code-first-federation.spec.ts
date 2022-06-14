import { ApolloFederationDriver } from '../../lib';
import { ApolloServerBase } from 'apollo-server-core';
import { ApplicationModule } from '../code-first-federation/app.module';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { gql } from '@apollo/client/core';

describe('Code-first - Federation', () => {
  let app: INestApplication;
  let apolloClient: ApolloServerBase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    const graphqlModule =
      app.get<GraphQLModule<ApolloFederationDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
  });

  it(`should return query result`, async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          _service {
            sdl
          }
        }
      `,
    });
    expect(response.data).toEqual({
      _service: {
        sdl: `directive @key(fields: _FieldSet!, resolvable: Boolean = true) repeatable on OBJECT | INTERFACE

directive @requires(fields: _FieldSet!) on FIELD_DEFINITION

directive @provides(fields: _FieldSet!) on FIELD_DEFINITION

directive @extends on OBJECT | INTERFACE

directive @external(reason: String) on OBJECT | FIELD_DEFINITION

directive @tag(name: String!) repeatable on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION

interface IRecipe {
  id: ID!
  title: String!
  externalField: String! @external
}

extend type Post
  @key(fields: \"id\")
{
  id: ID!
  title: String!
  authorId: Int!
}

extend type User
  @extends
  @key(fields: \"id\")
{
  id: ID! @external
  posts: [Post!]!
}

type Recipe implements IRecipe {
  id: ID!
  title: String!
  externalField: String! @external
  description: String!
}

type Query {
  findPost(id: Float!): Post!
  getPosts: [Post!]!
  search: [FederationSearchResultUnion!]! @deprecated(reason: \"test\")
  recipe: IRecipe!
  _entities(representations: [_Any!]!): [_Entity]!
  _service: _Service!
}

\"\"\"Search result description\"\"\"
union FederationSearchResultUnion = Post | User

scalar _FieldSet

scalar _Any

type _Service {
  sdl: String
}

union _Entity = Post | User`,
      },
    });
  });

  it('should return the search result', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          search {
            ... on Post {
              title
            }
            ... on User {
              id
            }
            __typename
          }
        }
      `,
    });
    expect(response.data).toEqual({
      search: [
        {
          id: '1',
          __typename: 'User',
        },
        {
          title: 'lorem ipsum',
          __typename: 'Post',
        },
      ],
    });
  });

  it(`should return query result`, async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          recipe {
            id
            title
            ... on Recipe {
              description
            }
          }
        }
      `,
    });
    expect(response.data).toEqual({
      recipe: {
        id: '1',
        title: 'Recipe',
        description: 'Interface description',
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
