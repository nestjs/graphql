import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApolloServerBase } from 'apollo-server-core';
import { gql } from 'apollo-server-express';
import { getApolloServer } from '../../lib';
import { ApplicationModule } from '../code-first-federation/app.module';

describe('Code-first - Federation', () => {
  let app: INestApplication;
  let apolloClient: ApolloServerBase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    apolloClient = getApolloServer(module);
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
        sdl: `interface IRecipe {
  id: ID!
  title: String!
  externalField: String! @external
}

type Post @key(fields: \"id\") {
  id: ID!
  title: String!
  authorId: Int!
}

type User @extends @key(fields: \"id\") {
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
}

\"\"\"Search result description\"\"\"
union FederationSearchResultUnion = Post | User
`,
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
