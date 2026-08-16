import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Author } from './author.dto.js';

@Resolver(() => Author)
export class AuthorResolver {
  @Query(() => Author)
  author(): Author {
    return { id: '1' } as Author;
  }

  /**
   * Options-object-only form: the schema field is named after `name`, while the
   * method keeps a different name. Both the schema field and the resolver map
   * entry have to end up as "displayName".
   */
  @ResolveField({ name: 'displayName' })
  resolveDisplayName(@Parent() author: Author): string {
    return `author-${author.id}`;
  }
}
