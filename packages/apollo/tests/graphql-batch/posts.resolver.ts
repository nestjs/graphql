import { BatchResolveField, Parent, Query, Resolver } from '@nestjs/graphql';
import { BlogService } from '../code-first-batch/blog.service.js';
import { Author } from '../code-first-batch/models/author.js';
import { Comment } from '../code-first-batch/models/comment.js';
import { Post } from '../code-first-batch/models/post.js';

/**
 * Schema-first counterpart of the code-first batch resolver: no type function
 * is needed, as the field types come from the SDL.
 */
@Resolver('Post')
export class PostsResolver {
  constructor(private readonly blogService: BlogService) {}

  @Query()
  posts(): Post[] {
    return this.blogService.findAllPosts();
  }

  @BatchResolveField()
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

  @BatchResolveField('comments', { keyBy: (post: Post) => post.id })
  postComments(@Parent() posts: Post[]): Map<string, Comment[]> {
    this.blogService.recordBatchCall({
      method: 'comments',
      size: posts.length,
    });

    const comments = this.blogService.findCommentsByPostIds(
      posts.map((post) => post.id),
    );
    return new Map(
      posts.map((post) => [
        post.id,
        comments.filter((comment) => comment.postId === post.id),
      ]),
    );
  }
}
