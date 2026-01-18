import { Query, Resolver } from '@nestjs/graphql';
import { Post } from './models/post.model';
import { NestedContent } from './models/nested-content.model';

@Resolver(() => Post)
export class PostsResolver {
  @Query(() => [Post])
  posts(): Post[] {
    return [
      new Post({
        id: '1',
        title: 'First Post',
        content: new NestedContent({
          text: 'Hello World',
          description: 'A sample post',
        }),
      }),
      new Post({
        id: '2',
        title: 'Second Post',
        content: new NestedContent({
          text: 'Another content',
        }),
      }),
    ];
  }
}
