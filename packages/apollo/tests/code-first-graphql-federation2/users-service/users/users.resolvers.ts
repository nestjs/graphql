import { Args, ID, Query, Resolver, ResolveReference } from '@nestjs/graphql';
import { User } from './users.entity';
import { UsersService } from './users.service';

@Resolver(User)
export class UsersResolvers {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { nullable: true })
  getUser(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findById(id);
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; id: string }) {
    return this.usersService.findById(reference.id);
  }
}
