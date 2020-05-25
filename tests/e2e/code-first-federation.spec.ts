import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ApplicationModule } from '../code-first-federation/app.module';

describe('Code-first - Federation', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it(`should return query result`, () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
        {
          _service { sdl }
        }`,
      })
      .expect(200, {
        data: {
          _service: {
            sdl:
              '"Search result description"\nunion FederationSearchResultUnion = Post | User\n\ntype Post @key(fields: "id") {\n  id: ID!\n  title: String!\n  authorId: Int!\n}\n\ntype Query {\n  findPost(id: Float!): Post!\n  getPosts: [Post!]!\n  search: [FederationSearchResultUnion!]! @deprecated(reason: "test")\n}\n\ntype User @extends @key(fields: "id") {\n  id: ID! @external\n  posts: [Post!]!\n}\n',
          },
        },
      });
  });

  it('should return the search result', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        operationName: null,
        variables: {},
        query: `
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
        }`,
      })
      .expect(200, {
        data: {
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
        },
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
