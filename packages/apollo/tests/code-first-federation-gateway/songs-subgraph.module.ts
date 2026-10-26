import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { Module } from '@nestjs/common';
import { GraphQLModule, ResolveReference, Resolver } from '@nestjs/graphql';
import { ApolloDriverConfig } from '../../lib/index.js';
import { ApolloFederationDriver } from '../../lib/drivers/index.js';

const songs = [{ id: '10', title: 'Song 10' }];

@Resolver('Song')
export class SongsResolver {
  @ResolveReference()
  resolveReference(reference: { id: string }) {
    return songs.find((song) => song.id === reference.id);
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      typeDefs: `
        type Song @key(fields: "id") {
          id: ID!
          title: String!
        }
      `,
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
  providers: [SongsResolver],
})
export class SongsSubgraphModule {}
