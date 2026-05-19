import { Module } from '@nestjs/common';
import { PostsResolvers } from './posts.resolvers.js';
import { UsersResolvers } from './users.resolvers.js';
import { PostsService } from './posts.service.js';
import { DateScalar } from './date.scalar.js';

@Module({
  providers: [PostsResolvers, PostsService, UsersResolvers, DateScalar],
})
export class PostsModule {}
