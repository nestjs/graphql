import { Module } from '@nestjs/common';
import {
  Args,
  GraphQLModule,
  Query,
  ResolveReference,
  Resolver,
} from '@nestjs/graphql';
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '../../lib/index.js';

const songs = [{ id: '1', title: 'Song 1' }];
const movies = [{ id: '2', name: 'Movie 2' }];

@Resolver('Song')
export class SongsResolver {
  @Query('song')
  song(@Args('id') id: string) {
    return songs.find((s) => s.id === id);
  }

  @ResolveReference()
  resolveReference(ref: { id: string }) {
    return songs.find((s) => s.id === ref.id);
  }
}

@Resolver('Movie')
export class MoviesResolver {
  @ResolveReference()
  resolveReference(ref: { id: string }) {
    return movies.find((m) => m.id === ref.id);
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      typeDefs: `
        type Song @key(fields: "id") {
          id: ID!
          title: String!
        }
        type Movie @key(fields: "id") {
          id: ID!
          name: String!
        }
        type Query {
          song(id: ID!): Song
        }
      `,
    }),
  ],
  providers: [SongsResolver, MoviesResolver],
})
export class MediaSubgraphModule {}
