import { ApolloServerBase } from 'apollo-server-core';
import { INestApplicationContext } from '@nestjs/common';
import { GraphQLModule, GraphQLFederationModule } from '..';

/**
 * Get ApolloServer instance for a given application, works for federation and
 * regular applications
 * @param app the Nest.js application to receive Apollo Server for
 * @returns Apollo Server instance of the given application
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
    return graphqlModule.apolloServer;
  } catch (error) {}
  throw new Error(
    'Nest could not find either the GraphQLFederationModule or GraphQLModule. Both modules are not registered in the given application.',
  );
}
