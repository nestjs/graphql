import { Module } from '@nestjs/common';
import {
  Args,
  createUnionType,
  Directive,
  Field,
  GraphQLModule,
  ID,
  ObjectType,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '../../lib/index.js';

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class Song {
  @Field(() => ID)
  @Directive('@external')
  id: string;
}

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class Movie {
  @Field(() => ID)
  @Directive('@external')
  id: string;
}

export const FavoriteItemUnion = createUnionType({
  name: 'FavoriteItemUnion',
  types: () => [Song, Movie] as const,
});

@ObjectType()
@Directive('@key(fields: "id")')
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field(() => FavoriteItemUnion)
  favoriteItem: typeof FavoriteItemUnion;

  @Field(() => FavoriteItemUnion)
  resolvedFavoriteItem?: typeof FavoriteItemUnion;
}

@Resolver(() => User)
export class UsersResolver {
  @Query(() => User)
  getUserById(@Args('id', { type: () => ID }) id: string): User {
    return {
      id,
      firstName: 'John',
      favoriteItem: { __typename: 'Song', id: '1' } as any,
    };
  }

  @Query(() => FavoriteItemUnion)
  getFavoriteItem(): typeof FavoriteItemUnion {
    return { __typename: 'Movie', id: '2' } as any;
  }

  @ResolveField(() => FavoriteItemUnion)
  resolvedFavoriteItem(): typeof FavoriteItemUnion {
    return { __typename: 'Movie', id: '2' } as any;
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [UsersResolver],
})
export class UsersSubgraphModule {}
