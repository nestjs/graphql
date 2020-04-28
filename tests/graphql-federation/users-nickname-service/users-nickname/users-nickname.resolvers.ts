import { Resolver, ResolveField, Parent, Query, Args } from '../../../../lib';
import { User } from './models/users.model';
import { GraphQLString } from 'graphql';
import { NotFoundException } from '@nestjs/common';

@Resolver((of) => User)
export class UsersNicknameResolver {
  @ResolveField('nickname', (returns) => GraphQLString)
  async nickname(@Parent() user: User): Promise<string> {
    const { name } = user;
    return `The fantastic ${name}`;
  }

  /**
   * Every schema needs at once one field on the `Query` type, so let's add this.
   */
  @Query((returns) => User)
  async _usersNicknameRootQueryField(): Promise<never> {
    throw new NotFoundException('');
  }
}
