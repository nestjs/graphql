import { Query, Args, ResolveReference, Resolver } from '../../../lib';
import { PostService } from './post.service';
import { Post } from './post.entity';

@Resolver(of => Post)
export class PostResolver {
  constructor(private readonly postService: PostService) {}

  @Query(returns => Post)
  public findPost(@Args('id') id: number) {
    return this.postService.findOne(id);
  }

  @Query(returns => [Post])
  public getPosts() {
    return this.postService.all();
  }

  @ResolveReference()
  public resolveRef(reference: any) {
    return this.postService.findOne(reference.id);
  }
}
