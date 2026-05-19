import { ResolveField, Resolver } from '@nestjs/graphql';
import { PostsService } from './posts.service.js';
@Resolver('User')
export class UsersResolvers {
  constructor(private readonly postsService: PostsService) {}

  @ResolveField('posts')
  getPosts(reference: any) {
    return this.postsService.findByUserId(reference.id);
  }
}
