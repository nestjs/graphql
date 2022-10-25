import { Module } from '@nestjs/common';
import { PostsResolvers } from './posts.resolvers';
import { UsersResolvers } from './users.resolvers';
import { PostsService } from './posts.service';

@Module({
  providers: [PostsResolvers, PostsService, UsersResolvers],
})
export class PostsModule {}
