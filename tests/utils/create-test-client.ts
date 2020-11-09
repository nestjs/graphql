import { TestingModule } from '@nestjs/testing';
import * as apolloServerTesting from 'apollo-server-testing';
import { getApolloServer } from '../../lib';

/**
 * Provides a single hook to run operations through the request pipeline,
 * enabling the most thorough tests possible without starting up an HTTP server.
 *
 * @param testingModule Nest testing module reference
 * @returns a query and mutate function that can be used to run operations against the
 * server instance. Currently, queries and mutations are the only operation
 * types supported by createTestClient.
 * @see https://www.apollographql.com/docs/apollo-server/testing/testing/
 */
export function createTestClient(
  testingModule: TestingModule,
): apolloServerTesting.ApolloServerTestClient {
  const apolloServer = getApolloServer(testingModule);
  return apolloServerTesting.createTestClient(apolloServer);
}
