import { ApolloServer, type BaseContext } from '@apollo/server';
import { INestApplicationContext } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '..';

type GetApolloServer = (
  app: INestApplicationContext,
) => ApolloServer<BaseContext>;

/**
 * Returns the underlying ApolloServer instance for a given application.
 * @param app Nest application reference
 * @returns Apollo Server instance used by the host application
 */
export const getApolloServer: GetApolloServer = (app) => {
  try {
    const graphqlModule = app.get<GraphQLModule<ApolloDriver>>(GraphQLModule);
    return graphqlModule.graphQlAdapter?.instance;
  } catch {
    /* empty */
  }

  throw new Error(
    `Nest could not find the "GraphQLModule" in your application's container. Please, double-check if it's registered in the given application.`,
  );
};
