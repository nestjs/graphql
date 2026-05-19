import { PostType } from './post-type.enum.js';

export interface Post {
  id: string;
  title: string;
  body: string;
  userId: string;
  publishDate: Date;
  type: PostType;
}
