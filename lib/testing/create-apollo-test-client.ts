import { TestingModule } from '@nestjs/testing';
import * as apolloServerTesting from 'apollo-server-testing';
import { GraphQLModule, GraphQLFederationModule } from '..';
import { ApolloServerBase } from 'apollo-server-core';

/**
 * Provides a single hook to run operations through the request pipeline,
 * enabling the most thorough tests possible without starting up an HTTP server.
 * @param testingModule the Nest.js testing module
 * @returns a query and mutate function that can be used to run operations against the
 * server instance. Currently, queries and mutations are the only operation
 * types supported by createTestClient.
 * @see https://www.apollographql.com/docs/apollo-server/testing/testing/
 */
export function createTestClient(
  testingModule: TestingModule,
): apolloServerTesting.ApolloServerTestClient {
  return apolloServerTesting.createTestClient(getApolloServer(testingModule));
}

function getApolloServer(testingModule: TestingModule): ApolloServerBase {
  try {
    const graphqlFederationModule = testingModule.get(GraphQLFederationModule);
    return graphqlFederationModule.apolloServer;
  } catch (error) {}
  try {
    const graphqlModule = testingModule.get(GraphQLModule);
    return graphqlModule.apolloServer;
  } catch (error) {}
  throw new Error(
    'Nest could not find GraphQLFederationModule or GraphQLModule element (this provider does not exist in the current context)',
  );
}
