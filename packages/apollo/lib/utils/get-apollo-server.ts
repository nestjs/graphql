import { INestApplicationContext } from '@nestjs/common';
import {
  GraphQLFederationModule,
  GraphQLModule,
} from '@nestjs/graphql-experimental';
import { ApolloServerBase } from 'apollo-server-core';

/**
 * Returns the underlying ApolloServer instance for a given application.
 * Supports both Apollo federation and regular GraphQL applications.
 * @param app Nest application reference
 * @returns Apollo Server instance used by the host application
 */
export function getApolloServer(
  app: INestApplicationContext,
): ApolloServerBase {
  try {
    const graphqlFederationModule = app.get(GraphQLFederationModule);
    return graphqlFederationModule.apolloServer;
  } catch (error) {}
  try {
    const graphqlModule = app.get(GraphQLModule);
    return graphqlModule.graphQlAdapter?.instance;
  } catch (error) {}
  throw new Error(
    'Nest could not find either the GraphQLFederationModule or GraphQLModule. Neither module is registered in the given application.',
  );
}
