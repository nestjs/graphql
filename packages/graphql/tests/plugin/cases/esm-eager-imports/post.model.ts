/**
 * In an ES module the eager import must be a static namespace import: a hoisted
 * "require" call would not exist at runtime and would throw
 * ERR_REQUIRE_CYCLE_MODULE on self-references and import cycles. Types declared
 * in the same file are referenced through their local binding instead.
 */

import { Author } from './author.model.js';

declare const ObjectType: any;

@ObjectType()
export class Comment {
  body: string;
}

@ObjectType()
export class Post {
  author: Author;
  authors: Author[];
  comments: Comment[];
}
