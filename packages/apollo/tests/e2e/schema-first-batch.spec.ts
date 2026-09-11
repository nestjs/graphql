import { ApolloServer } from '@apollo/server';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { gql } from 'graphql-tag';
import { ApolloDriver } from '../../lib/index.js';
import { BlogService } from '../code-first-batch/blog.service.js';
import { ApplicationModule } from '../graphql-batch/app.module.js';
import { expectSingleResult } from '../utils/assertion-utils.js';

describe('Schema-first - @BatchResolveField', () => {
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
  });

  afterEach(async () => {
    await app?.close();
  });

  it('should batch the field resolvers declared without a type function', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          posts {
            title
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

    expectSingleResult(response).toEqual({
      posts: [
        {
          title: 'Post #1',
          author: { name: 'Kamil' },
          comments: [{ text: 'Comment #1' }, { text: 'Comment #2' }],
        },
        { title: 'Post #2', author: { name: 'Kamil' }, comments: [] },
        {
          title: 'Post #3',
          author: { name: 'Manuel' },
          comments: [{ text: 'Comment #3' }],
        },
        { title: 'Post #4', author: { name: 'Manuel' }, comments: [] },
      ],
    });
    expect(blogService.batchCalls).toHaveLength(2);
    expect(blogService.batchCalls).toEqual(
      expect.arrayContaining([
        { method: 'author', size: 4 },
        { method: 'comments', size: 4 },
      ]),
    );
  });
});
