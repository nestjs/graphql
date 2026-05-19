import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { User } from './user.dto.js';
import { UserService } from './user.service.js';
import { CreateUserInput } from './create-user.input.js';
import { Status } from './user-status.dto.js';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User], { name: 'users' })
  findAll(): User[] {
    return this.userService.findAll();
  }

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput): User {
    return this.userService.create(createUserInput);
  }

  @ResolveField('status', undefined, {
    nullable: true,
    description: 'Resolve Field Description',
  })
  getStatus(@Parent() user: User): Status {
    return {
      id: 'status-id',
      code: 'ACTIVE',
    };
  }
}
