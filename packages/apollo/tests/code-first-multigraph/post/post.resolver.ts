import {
  Resolver,
  Query,
  ResolveField,
  Parent,
  ID,
  Args,
} from '@nestjs/graphql';

import { User } from './external-user/user.type';
import { Post, Publication } from './post.type';

@Resolver(() => Post)
export class PostResolver {
  store = new Set<Post>([
    {
      id: 1,
      authorId: 1,
      title: 'How to Jedi II',
      status: Publication.PUBLISHED,
    },
    {
      id: 2,
      authorId: 2,
      title: 'Why lightsabers are unreliable',
      status: Publication.DRAFT,
    },
  ]);

  @Query(() => [Post])
  posts() {
    return [...this.store];
  }

  @Query(() => [Post])
  post(@Args('id', { type: () => ID }) id: number): Post | undefined {
    for (const post of this.store) {
      if (post.id.toString() === id.toString()) {
        return post;
      }
    }
  }

  @ResolveField(() => User)
  user(@Parent() post: Post) {
    return { __typename: 'User', id: post.authorId };
  }
}
