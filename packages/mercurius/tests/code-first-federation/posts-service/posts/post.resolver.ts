import { Args, Query, Resolver, ResolveReference } from '@nestjs/graphql';
import { FederationSearchResultUnion } from '../unions/search-result.union.js';
import { User } from '../users/user.entity.js';
import { Post } from './post.entity.js';
import { PostService } from './post.service.js';

@Resolver((of) => Post)
export class PostResolver {
  constructor(private readonly postService: PostService) {}

  @Query((returns) => Post)
  public findPost(@Args('id') id: number) {
    return this.postService.findOne(id);
  }

  @Query((returns) => [Post])
  public getPosts() {
    return this.postService.all();
  }

  @Query((returns) => [FederationSearchResultUnion], {
    deprecationReason: 'test',
  })
  search(): Array<typeof FederationSearchResultUnion> {
    return [
      new User({ id: 1, posts: [] }),
      new Post({ id: 2, title: 'lorem ipsum', authorId: 1 }),
    ];
  }

  @ResolveReference()
  public resolveRef(reference: any) {
    return this.postService.findOne(reference.id);
  }
}
