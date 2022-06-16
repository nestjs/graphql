import { ResolveField, Resolver } from '@nestjs/graphql';
import { Post } from './posts.entity';
import { PostsService } from './posts.service';
import { User } from './user.entity';

@Resolver(User)
export class UsersResolvers {
  constructor(private readonly postsService: PostsService) {}

  @ResolveField('posts', () => [Post])
  getPosts(reference: any) {
    return this.postsService.findByUserId(reference.id);
  }
}
