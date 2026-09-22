import { ApolloServer } from '@apollo/server';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { gql } from 'graphql-tag';
import { ApolloDriver } from '../../lib/index.js';
import { ApplicationModule } from '../code-first-batch-interceptors/app.module.js';
import { InterceptorCallsService } from '../code-first-batch-interceptors/comments-connection.interceptor.js';
import { CommentsRepository } from '../code-first-batch-interceptors/posts.resolver.js';
import { expectSingleResult } from '../utils/assertion-utils.js';

const cursorOf = (id: string) => Buffer.from(id).toString('base64');

describe('Code-first - @BatchResolveField with an output-mapping interceptor', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;
  let commentsRepository: CommentsRepository;
  let interceptorCalls: InterceptorCallsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const graphqlModule = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
    commentsRepository = app.get(CommentsRepository);
    interceptorCalls = app.get(InterceptorCallsService);
    commentsRepository.reset();
    interceptorCalls.reset();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('should let an interceptor rewrite the whole batch output', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          posts {
            id
            comments {
              totalCount
              pageInfo {
                hasNextPage
                startCursor
                endCursor
              }
              edges {
                cursor
                node {
                  id
                  body
                }
              }
            }
          }
        }
      `,
    });

    // The resolver returned raw entities with a "text" property; what reaches
    // the client is the connection the interceptor built, with "body" nodes.
    expectSingleResult(response).toEqual({
      posts: [
        {
          id: 'p1',
          comments: {
            totalCount: 2,
            pageInfo: {
              hasNextPage: false,
              startCursor: cursorOf('c1'),
              endCursor: cursorOf('c2'),
            },
            edges: [
              {
                cursor: cursorOf('c1'),
                node: { id: 'c1', body: 'Comment #1' },
              },
              {
                cursor: cursorOf('c2'),
                node: { id: 'c2', body: 'Comment #2' },
              },
            ],
          },
        },
        {
          id: 'p2',
          comments: {
            totalCount: 0,
            pageInfo: {
              hasNextPage: false,
              startCursor: null,
              endCursor: null,
            },
            edges: [],
          },
        },
        {
          id: 'p3',
          comments: {
            totalCount: 1,
            pageInfo: {
              hasNextPage: false,
              startCursor: cursorOf('c3'),
              endCursor: cursorOf('c3'),
            },
            edges: [
              {
                cursor: cursorOf('c3'),
                node: { id: 'c3', body: 'Comment #3' },
              },
            ],
          },
        },
        {
          id: 'p4',
          comments: {
            totalCount: 0,
            pageInfo: {
              hasNextPage: false,
              startCursor: null,
              endCursor: null,
            },
            edges: [],
          },
        },
      ],
    });
  });

  it('should run the interceptor once per batch, over every parent at once', async () => {
    await apolloClient.executeOperation({
      query: gql`
        {
          posts {
            comments {
              totalCount
            }
          }
        }
      `,
    });

    // One database round-trip for the four posts...
    expect(commentsRepository.batchSizes).toEqual([4]);
    // ...and one interceptor pass, holding the map of all four parents.
    expect(interceptorCalls.batchSizes).toEqual([4]);
  });

  it('should keep the batching intact across requests', async () => {
    const query = gql`
      {
        posts {
          comments {
            totalCount
          }
        }
      }
    `;

    await apolloClient.executeOperation({ query });
    await apolloClient.executeOperation({ query });

    expect(commentsRepository.batchSizes).toEqual([4, 4]);
    expect(interceptorCalls.batchSizes).toEqual([4, 4]);
  });

  it('should expose the mapped type in the schema, not the entity', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          __type(name: "Post") {
            fields {
              name
              type {
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      __type: {
        fields: expect.arrayContaining([
          {
            name: 'comments',
            type: {
              kind: 'NON_NULL',
              ofType: { name: 'CommentConnection', kind: 'OBJECT' },
            },
          },
        ]),
      },
    });
  });
});
