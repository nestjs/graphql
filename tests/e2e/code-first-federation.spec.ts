import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { gql } from 'apollo-server-express';
import { ApolloServerTestClient } from 'apollo-server-testing';
import { ApplicationModule } from '../code-first-federation/app.module';
import { createTestClient } from '../utils/create-test-client';

describe('Code-first - Federation', () => {
  let app: INestApplication;
  let apolloClient: ApolloServerTestClient;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    apolloClient = createTestClient(module);
  });

  it(`should return query result`, async () => {
    const response = await apolloClient.query({
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
        sdl:
          '"Search result description"\nunion FederationSearchResultUnion = Post | User\n\ntype Post @key(fields: "id") {\n  id: ID!\n  title: String!\n  authorId: Int!\n}\n\ntype Query {\n  findPost(id: Float!): Post!\n  getPosts: [Post!]!\n  search: [FederationSearchResultUnion!]! @deprecated(reason: "test")\n}\n\ntype User @extends @key(fields: "id") {\n  id: ID! @external\n  posts: [Post!]!\n}\n',
      },
    });
  });

  it('should return the search result', async () => {
    const response = await apolloClient.query({
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

  afterEach(async () => {
    await app.close();
  });
});
