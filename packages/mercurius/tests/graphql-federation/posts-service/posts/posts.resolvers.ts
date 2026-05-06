import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { PostType } from './post-type.enum.js';
import { Post } from './posts.interfaces.js';
import { PostsService } from './posts.service.js';
@Resolver('Post')
export class PostsResolvers {
  constructor(private readonly postsService: PostsService) {}

  @Query('getPosts')
  getPosts(@Args('type') type: PostType) {
    if (type) {
      return this.postsService.findByType(type);
    } else {
      return this.postsService.findAll();
    }
  }

  @Mutation()
  publishPost(@Args('id') id, @Args('publishDate') publishDate: Date) {
    return this.postsService.publish(id, publishDate);
  }

  @ResolveField('user')
  getUser(@Parent() post: Post) {
    return { __typename: 'User', id: post.userId };
  }
}
