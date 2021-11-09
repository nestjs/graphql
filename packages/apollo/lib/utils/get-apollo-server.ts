import { INestApplicationContext } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { ApolloServerBase } from 'apollo-server-core';

/**
 * Returns the underlying ApolloServer instance for a given application.
 * @param app Nest application reference
 * @returns Apollo Server instance used by the host application
 */
export function getApolloServer(
  app: INestApplicationContext,
): ApolloServerBase {
  try {
    const graphqlModule = app.get(GraphQLModule);
    return graphqlModule.graphQlAdapter?.instance;
  } catch (error) {}
  throw new Error(
    `Nest could not find the "GraphQLModule" in your application's container. Please, double-check if it's registered in the given application.`,
  );
}
