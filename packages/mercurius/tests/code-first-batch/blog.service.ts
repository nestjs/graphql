import { Injectable } from '@nestjs/common';
import { Author } from './models/author.js';
import { Comment } from './models/comment.js';
import { Post } from './models/post.js';

export interface BatchCall {
  method: string;
  size: number;
  args?: Record<string, any>;
}

const authors: Author[] = [
  { id: 'a1', name: 'Kamil' },
  { id: 'a2', name: 'Manuel' },
];

const posts: Post[] = [
  { id: 'p1', title: 'Post #1', authorId: 'a1' },
  { id: 'p2', title: 'Post #2', authorId: 'a1' },
  { id: 'p3', title: 'Post #3', authorId: 'a2' },
  { id: 'p4', title: 'Post #4', authorId: 'a2' },
];

const comments: Comment[] = [
  { id: 'c1', text: 'Comment #1', postId: 'p1' },
  { id: 'c2', text: 'Comment #2', postId: 'p1' },
  { id: 'c3', text: 'Comment #3', postId: 'p3' },
];

@Injectable()
export class BlogService {
  readonly batchCalls: BatchCall[] = [];

  recordBatchCall(call: BatchCall) {
    this.batchCalls.push(call);
  }

  reset() {
    this.batchCalls.length = 0;
  }

  findAllPosts(): Post[] {
    return posts.map((post) => ({ ...post }));
  }

  findAuthorsByIds(ids: string[]): Author[] {
    return authors.filter((author) => ids.includes(author.id));
  }

  findCommentsByPostIds(ids: string[]): Comment[] {
    return comments.filter((comment) => ids.includes(comment.postId));
  }
}
