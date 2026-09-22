import { Injectable, UseInterceptors } from '@nestjs/common';
import { BatchResolveField, Parent, Query, Resolver } from '@nestjs/graphql';
import { Post } from '../code-first-batch/models/post.js';
import { CommentsConnectionInterceptor } from './comments-connection.interceptor.js';
import {
  CommentConnection,
  CommentEntity,
} from './models/comment-connection.js';

const posts: Post[] = [
  { id: 'p1', title: 'Post #1', authorId: 'a1' },
  { id: 'p2', title: 'Post #2', authorId: 'a1' },
  { id: 'p3', title: 'Post #3', authorId: 'a2' },
  { id: 'p4', title: 'Post #4', authorId: 'a2' },
];

const comments: CommentEntity[] = [
  { id: 'c1', text: 'Comment #1', postId: 'p1' },
  { id: 'c2', text: 'Comment #2', postId: 'p1' },
  { id: 'c3', text: 'Comment #3', postId: 'p3' },
];

@Injectable()
export class CommentsRepository {
  readonly batchSizes: number[] = [];

  reset() {
    this.batchSizes.length = 0;
  }

  findByPostIds(ids: string[]): CommentEntity[] {
    this.batchSizes.push(ids.length);
    return comments.filter((comment) => ids.includes(comment.postId));
  }
}

@Resolver(() => Post)
export class PostsResolver {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  @Query(() => [Post])
  posts(): Post[] {
    return posts.map((post) => ({ ...post }));
  }

  /**
   * Returns raw entities keyed by parent. The interceptor is what turns them
   * into the `CommentConnection` the schema advertises.
   */
  @UseInterceptors(CommentsConnectionInterceptor)
  @BatchResolveField(() => CommentConnection, { name: 'comments' })
  commentsConnection(
    @Parent() batchedPosts: Post[],
  ): Map<Post, CommentEntity[]> {
    const found = this.commentsRepository.findByPostIds(
      batchedPosts.map((post) => post.id),
    );

    return new Map(
      batchedPosts.map((post) => [
        post,
        found.filter((comment) => comment.postId === post.id),
      ]),
    );
  }
}
