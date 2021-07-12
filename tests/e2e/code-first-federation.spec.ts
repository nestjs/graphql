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
        sdl: '"""Search result description"""\nunion FederationSearchResultUnion = Post | User\n\ninterface IRecipe {\n  id: ID!\n  title: String!\n  externalField: String! @external\n}\n\ntype Post @key(fields: "id") {\n  id: ID!\n  title: String!\n  authorId: Int!\n}\n\ntype Query {\n  findPost(id: Float!): Post!\n  getPosts: [Post!]!\n  search: [FederationSearchResultUnion!]! @deprecated(reason: "test")\n  recipe: IRecipe!\n}\n\ntype Recipe implements IRecipe {\n  id: ID!\n  title: String!\n  externalField: String! @external\n  description: String!\n}\n\ntype User @extends @key(fields: "id") {\n  id: ID! @external\n  posts: [Post!]!\n}\n',
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
