import {
  Args,
  BatchResolveField,
  Parent,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { BlogService } from './blog.service.js';
import { Author } from './models/author.js';
import { Comment } from './models/comment.js';
import { Post } from './models/post.js';

/**
 * Records the parents the field middleware of `authorName` was called with, so
 * that the tests can tell it still runs once per field.
 */
export const authorNameMiddlewareCalls: string[] = [];

@Resolver(() => Post)
export class PostsResolver {
  constructor(private readonly blogService: BlogService) {}

  @Query(() => [Post])
  posts(): Post[] {
    return this.blogService.findAllPosts();
  }

  /**
   * Returns a `Map` keyed by the parent objects themselves.
   */
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

  /**
   * Returns a `Map` keyed by the value produced by `keyBy`.
   */
  @BatchResolveField(() => [Comment], { keyBy: (post: Post) => post.id })
  async comments(@Parent() posts: Post[]): Promise<Map<string, Comment[]>> {
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

  /**
   * Returns an array holding one entry per parent, and takes field arguments,
   * which must never end up sharing a batch with a different set of values.
   */
  @BatchResolveField('tags', () => [String])
  postTags(
    @Parent() posts: Post[],
    @Args('prefix') prefix: string,
  ): string[][] {
    this.blogService.recordBatchCall({
      method: 'tags',
      size: posts.length,
      args: { prefix },
    });

    return posts.map((post) => [`${prefix}:${post.id}`]);
  }

  /**
   * Takes no parameter decorators, which lets the explorer fall back to its
   * fast field resolver path - the parents still come in as the first argument.
   */
  @BatchResolveField(() => String, { name: 'slug' })
  resolveSlug(posts: Post[]): Map<Post, string> {
    this.blogService.recordBatchCall({ method: 'slug', size: posts.length });

    return new Map(posts.map((post) => [post, `slug-${post.id}`]));
  }

  /**
   * Field middleware wraps the batch resolver, so it keeps running once per
   * field while the method itself is still called once per batch.
   */
  @BatchResolveField(() => String, {
    name: 'authorName',
    middleware: [
      async (ctx, next) => {
        authorNameMiddlewareCalls.push((ctx.source as Post).id);
        return String(await next()).toUpperCase();
      },
    ],
  })
  resolveAuthorName(@Parent() posts: Post[]): Map<Post, string> {
    this.blogService.recordBatchCall({
      method: 'authorName',
      size: posts.length,
    });

    const authors = this.blogService.findAuthorsByIds(
      posts.map((post) => post.authorId),
    );
    return new Map(
      posts.map((post) => [
        post,
        authors.find((author) => author.id === post.authorId)?.name,
      ]),
    );
  }
}
