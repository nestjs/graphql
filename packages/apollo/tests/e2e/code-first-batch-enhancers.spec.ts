import { ApolloServer } from '@apollo/server';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { gql } from 'graphql-tag';
import { ApolloDriver } from '../../lib/index.js';
import { BlogService } from '../code-first-batch/blog.service.js';
import { ApplicationModule } from '../code-first-batch-enhancers/app.module.js';
import { GuardCallsService } from '../code-first-batch-enhancers/recording.guard.js';
import { expectSingleResult } from '../utils/assertion-utils.js';

describe('Code-first - @BatchResolveField with field resolver enhancers', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;
  let blogService: BlogService;
  let guardCalls: GuardCallsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const graphqlModule = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
    blogService = app.get(BlogService);
    guardCalls = app.get(GuardCallsService);
    blogService.reset();
    guardCalls.reset();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('should run the guard once per batch, with every parent as the root', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          posts {
            author {
              name
            }
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      posts: [
        { author: { name: 'Kamil' } },
        { author: { name: 'Kamil' } },
        { author: { name: 'Manuel' } },
        { author: { name: 'Manuel' } },
      ],
    });
    expect(blogService.batchCalls).toEqual([{ method: 'author', size: 4 }]);

    // The guard sits inside the batch, so it runs once and receives the whole
    // array of parents rather than a single one.
    expect(guardCalls.roots).toHaveLength(1);
    expect(guardCalls.roots[0]).toEqual([
      { id: 'p1', title: 'Post #1', authorId: 'a1' },
      { id: 'p2', title: 'Post #2', authorId: 'a1' },
      { id: 'p3', title: 'Post #3', authorId: 'a2' },
      { id: 'p4', title: 'Post #4', authorId: 'a2' },
    ]);
  });
});
