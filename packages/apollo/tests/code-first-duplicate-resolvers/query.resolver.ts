import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class QueryResolver {
  @Query(() => Boolean, { name: '_' })
  test() {
    return true;
  }
}
