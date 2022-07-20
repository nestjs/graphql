import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { PostType } from './post-type.enum';
import { Post } from './posts.entity';
import { PostsService } from './posts.service';
import { User } from './user.entity';

@Resolver(Post)
export class PostsResolvers {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => [Post])
  getPosts(
    @Args('type', { nullable: true, type: () => PostType }) type: PostType,
  ) {
    if (type) {
      return this.postsService.findByType(type);
    } else {
      return this.postsService.findAll();
    }
  }

  @Mutation(() => Post)
  publishPost(
    @Args('id', { type: () => ID }) id,
    @Args('publishDate') publishDate: Date,
  ) {
    return this.postsService.publish(id, publishDate);
  }

  @ResolveField('user', () => User, { nullable: true })
  getUser(@Parent() post: Post) {
    return { __typename: 'User', id: post.userId };
  }
}
