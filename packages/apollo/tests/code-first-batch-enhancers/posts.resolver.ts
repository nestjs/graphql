import { UseGuards } from '@nestjs/common';
import { BatchResolveField, Parent, Query, Resolver } from '@nestjs/graphql';
import { BlogService } from '../code-first-batch/blog.service.js';
import { Author } from '../code-first-batch/models/author.js';
import { Post } from '../code-first-batch/models/post.js';
import { RecordingGuard } from './recording.guard.js';

@Resolver(() => Post)
export class PostsResolver {
  constructor(private readonly blogService: BlogService) {}

  @Query(() => [Post])
  posts(): Post[] {
    return this.blogService.findAllPosts();
  }

  @UseGuards(RecordingGuard)
  @BatchResolveField(() => Author)
  author(@Parent() posts: Post[]): Map<Post, Author> {
    this.blogService.recordBatchCall({ method: 'author', size: posts.length });

    const authors = this.blogService.findAuthorsByIds(
      posts.map((post) => post.authorId),
    );
    return new Map(
      posts.map((post) => [
        post,
        authors.find((author) => author.id === post.authorId),
      ]),
    );
  }
}
