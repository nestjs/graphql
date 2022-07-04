import { Resolver, Query, Args, ResolveReference } from '@nestjs/graphql';
import { User } from './user.entity';
import { UserService } from './user.service';

@Resolver((of) => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User, { nullable: true })
  findUser(@Args('id') id: number) {
    return this.userService.findOne(id);
  }

  @ResolveReference()
  public resolveRef(reference: any) {
    return this.userService.findOne(reference.id);
  }
}
