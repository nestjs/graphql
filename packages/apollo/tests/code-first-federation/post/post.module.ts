import { Module } from '@nestjs/common';
import { PostService } from './post.service.js';
import { PostResolver } from './post.resolver.js';

@Module({
  providers: [PostService, PostResolver],
  exports: [PostService],
})
export class PostModule {}
