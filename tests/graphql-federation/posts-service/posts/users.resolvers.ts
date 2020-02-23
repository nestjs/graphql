import { Resolver, ResolveProperty } from '../../../../lib';
import { PostsService } from './posts.service';

@Resolver('User')
export class UsersResolvers {
  constructor(private readonly postsService: PostsService) {}

  @ResolveProperty('posts')
  getPosts(reference: any) {
    return this.postsService.findByUserId(reference.id);
  }
}
