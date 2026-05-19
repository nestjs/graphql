import { createUnionType } from '@nestjs/graphql';
import { Post } from '../posts/post.entity.js';
import { User } from '../users/user.entity.js';

export const FederationSearchResultUnion = createUnionType({
  name: 'FederationSearchResultUnion',
  description: 'Search result description',
  types: () => [Post, User],
  resolveType: (value) => {
    if ('posts' in value) {
      return User;
    }
    if ('title' in value) {
      return Post;
    }
    return undefined;
  },
});
