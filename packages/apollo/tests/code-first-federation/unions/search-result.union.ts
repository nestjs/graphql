import { createUnionType } from '@nestjs/graphql/type-factories/index.js';
import { Post } from '../post/post.entity.js';
import { User } from '../user/user.entity.js';

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
