import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { ApolloDriver } from '../../lib';
import { GlobalSetupIssueModule } from './app.module';
import { expectSingleResult } from '../utils/assertion-utils';

/**
 * This test reproduces the issue described in:
 * https://github.com/nestjs/graphql/issues/3356
 *
 * When Jest's globalSetup initializes the NestJS GraphQL app,
 * the @Field() decorators store type references (String, Number, Boolean)
 * from the globalSetup's VM context. Later, when the test file runs
 * in a different VM context and initializes the app again, the
 * TypeMapperService fails to map the nested type's scalar fields
 * because its Map uses strict equality (===) for key lookup.
 *
 * Expected behavior: The app should initialize successfully
 * Actual behavior: Error "Cannot determine a GraphQL output type for the 'text'"
 */
describe('GlobalSetup Issue - Nested Types (Issue #3356)', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeEach(async () => {
    console.log('\n=== Test: Initializing app second time ===');
    console.log('test String reference:', String);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GlobalSetupIssueModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // This will fail with:
    // "Cannot determine a GraphQL output type for the 'text'. Make sure your class is decorated with an appropriate decorator."
    await app.init();

    const graphqlModule = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
    console.log('=== Test: App initialized successfully ===\n');
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should query posts with nested content', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          posts {
            id
            title
            content {
              text
              description
            }
          }
        }
      `,
    });

    expectSingleResult(response).toEqual({
      posts: [
        {
          id: '1',
          title: 'First Post',
          content: {
            text: 'Hello World',
            description: 'A sample post',
          },
        },
        {
          id: '2',
          title: 'Second Post',
          content: {
            text: 'Another content',
            description: null,
          },
        },
      ],
    });
  });
});
