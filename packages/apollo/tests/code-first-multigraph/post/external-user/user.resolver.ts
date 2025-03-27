import { Resolver, ResolveField, Parent } from '@nestjs/graphql';

import { Post, Publication } from '../post.type';
import { User } from './user.type';

@Resolver(() => User)
export class UserResolver {
  @ResolveField('posts', () => [Post])
  userPosts(@Parent() user: User): Post[] {
    return [
      { id: 10, authorId: user.id, status: Publication.DRAFT, title: 'test' },
    ];
  }
}
