import { ResolveField, Resolver } from '../../../../lib';
import { PostsService } from './posts.service';

@Resolver('User')
export class UsersResolvers {
  constructor(private readonly postsService: PostsService) {}

  @ResolveField('posts')
  getPosts(reference: any) {
    return this.postsService.findByUserId(reference.id);
  }
}
