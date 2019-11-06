import { Query, Resolver, Parent, ResolveProperty, Mutation, Args } from '../../../../lib';
import { PostsService } from './posts.service';
import { Post } from './posts.interfaces';

@Resolver('Post')
export class PostsResolvers {
  constructor(private readonly postsService: PostsService) {}

  @Query('getPosts')
  getPosts() {
    return this.postsService.findAll();
  }

  @Mutation()
  publishPost(@Args('id') id, @Args('publishDate') publishDate: Date) {
    return this.postsService.publish(id, publishDate);
  }

  @ResolveProperty('user')
  getUser(@Parent() post: Post) {
    return { __typename: 'User', id: post.userId };
  }
}
