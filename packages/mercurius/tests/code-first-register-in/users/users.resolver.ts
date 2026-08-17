import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input.js';
import { User } from './user.model.js';

@Resolver((of) => User)
export class UsersResolver {
  private readonly _users: User[] = [
    { id: '1', name: 'Ada', info: { version: '1.0.0' } },
  ];

  @Query((returns) => [User])
  users(): User[] {
    return this._users;
  }

  @Mutation((returns) => User)
  createUser(@Args('input') input: CreateUserInput): User {
    const user = {
      id: String(this._users.length + 1),
      name: input.name,
      info: { version: '1.0.0' },
    };
    this._users.push(user);
    return user;
  }
}
