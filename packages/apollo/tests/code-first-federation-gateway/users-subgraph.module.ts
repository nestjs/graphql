import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { Module } from '@nestjs/common';
import {
  Directive,
  Field,
  GraphQLModule,
  ID,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { ApolloDriverConfig } from '../../lib/index.js';
import { ApolloFederationDriver } from '../../lib/drivers/index.js';

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class Song {
  @Field(() => ID)
  @Directive('@external')
  id: string;
}

@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Song)
  favoriteSong: Song;
}

@Resolver(() => User)
export class UsersResolver {
  @Query(() => User)
  user(): User {
    return { id: '1', name: 'John', favoriteSong: { id: '10' } };
  }
}

/**
 * Code-first Federation 1 subgraph that extends the "Song" entity owned by
 * the songs subgraph.
 */
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: true,
      includeStacktraceInErrorResponses: false,
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
  providers: [UsersResolver],
})
export class UsersSubgraphModule {}
