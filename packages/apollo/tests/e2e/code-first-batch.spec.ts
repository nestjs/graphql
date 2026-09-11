import { ApolloServer } from '@apollo/server';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { gql } from 'graphql-tag';
import { ApolloDriver } from '../../lib/index.js';
import { ApplicationModule } from '../code-first-batch/app.module.js';
import { BlogService } from '../code-first-batch/blog.service.js';
import { authorNameMiddlewareCalls } from '../code-first-batch/posts.resolver.js';
import { expectSingleResult } from '../utils/assertion-utils.js';

describe('Code-first - @BatchResolveField', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;
  let blogService: BlogService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const graphqlModule = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
    blogService = app.get(BlogService);
    blogService.reset();
    authorNameMiddlewareCalls.length = 0;
  });

  afterEach(async () => {
    await app?.close();
  });

  it('should resolve every parent with a single call to the batch method', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          posts {
            title
            author {
              name
            }
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      posts: [
        { title: 'Post #1', author: { name: 'Kamil' } },
        { title: 'Post #2', author: { name: 'Kamil' } },
        { title: 'Post #3', author: { name: 'Manuel' } },
        { title: 'Post #4', author: { name: 'Manuel' } },
      ],
    });
    expect(blogService.batchCalls).toEqual([{ method: 'author', size: 4 }]);
  });

  it('should look the parents up by "keyBy" when the option is given', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          posts {
            title
            comments {
              text
            }
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      posts: [
        {
          title: 'Post #1',
          comments: [{ text: 'Comment #1' }, { text: 'Comment #2' }],
        },
        { title: 'Post #2', comments: [] },
        { title: 'Post #3', comments: [{ text: 'Comment #3' }] },
        { title: 'Post #4', comments: [] },
      ],
    });
    expect(blogService.batchCalls).toEqual([{ method: 'comments', size: 4 }]);
  });

  it('should batch several batch fields of the same query independently', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          posts {
            author {
              name
            }
            comments {
              text
            }
          }
        }
      `,
    });

    expectSingleResult(response);
    expect(blogService.batchCalls).toHaveLength(2);
    expect(blogService.batchCalls).toEqual(
      expect.arrayContaining([
        { method: 'author', size: 4 },
        { method: 'comments', size: 4 },
      ]),
    );
  });

  it('should map an array returned by the batch method positionally', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          posts {
            id
            tags(prefix: "tag")
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      posts: [
        { id: 'p1', tags: ['tag:p1'] },
        { id: 'p2', tags: ['tag:p2'] },
        { id: 'p3', tags: ['tag:p3'] },
        { id: 'p4', tags: ['tag:p4'] },
      ],
    });
    expect(blogService.batchCalls).toEqual([
      { method: 'tags', size: 4, args: { prefix: 'tag' } },
    ]);
  });

  it('should not batch parents requested with different field arguments together', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          posts {
            id
            first: tags(prefix: "a")
            second: tags(prefix: "b")
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      posts: [
        { id: 'p1', first: ['a:p1'], second: ['b:p1'] },
        { id: 'p2', first: ['a:p2'], second: ['b:p2'] },
        { id: 'p3', first: ['a:p3'], second: ['b:p3'] },
        { id: 'p4', first: ['a:p4'], second: ['b:p4'] },
      ],
    });
    expect(blogService.batchCalls).toHaveLength(2);
    expect(blogService.batchCalls).toEqual(
      expect.arrayContaining([
        { method: 'tags', size: 4, args: { prefix: 'a' } },
        { method: 'tags', size: 4, args: { prefix: 'b' } },
      ]),
    );
  });

  it('should scope the loaders to a single request', async () => {
    const query = gql`
      {
        posts {
          author {
            name
          }
        }
      }
    `;

    await apolloClient.executeOperation({ query });
    await apolloClient.executeOperation({ query });

    expect(blogService.batchCalls).toEqual([
      { method: 'author', size: 4 },
      { method: 'author', size: 4 },
    ]);
  });

  it('should batch methods that take no parameter decorators', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          posts {
            id
            slug
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      posts: [
        { id: 'p1', slug: 'slug-p1' },
        { id: 'p2', slug: 'slug-p2' },
        { id: 'p3', slug: 'slug-p3' },
        { id: 'p4', slug: 'slug-p4' },
      ],
    });
    expect(blogService.batchCalls).toEqual([{ method: 'slug', size: 4 }]);
  });

  it('should run the field middleware once per field, around the batch', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          posts {
            id
            authorName
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      posts: [
        { id: 'p1', authorName: 'KAMIL' },
        { id: 'p2', authorName: 'KAMIL' },
        { id: 'p3', authorName: 'MANUEL' },
        { id: 'p4', authorName: 'MANUEL' },
      ],
    });
    expect(blogService.batchCalls).toEqual([{ method: 'authorName', size: 4 }]);
    expect(authorNameMiddlewareCalls).toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('should expose batch fields in the generated schema like regular ones', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          __type(name: "Post") {
            fields {
              name
            }
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      __type: {
        fields: expect.arrayContaining(
          ['id', 'title', 'author', 'comments', 'tags'].map((name) => ({
            name,
          })),
        ),
      },
    });
  });
});
