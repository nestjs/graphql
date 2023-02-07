import { Args, Mutation, Resolver } from '@nestjs/graphql';

@Resolver()
export class UserResolver {
  @Mutation(() => String, { name: 'moduleALogin' })
  login(@Args('code') code: string) {
    return code;
  }
}
