import { ResolveField, Resolver, Query, Parent } from '@nestjs/graphql';
import { AuthorDocument, getAllAuthors, getAllBooks } from '../datasource/data';
import { Author, Book } from './public.models';

@Resolver((of) => Author)
export class AuthorResolver {
  @Query((returns) => [Author], { name: 'authors' })
  getAuthors() {
    return getAllAuthors().map((author) => ({
      ...author,
      name: author.penName,
    }));
  }

  @ResolveField((returns) => [Book], { name: 'books' })
  getBooksByAuthor(@Parent() parent: AuthorDocument) {
    return getAllBooks().filter((book) => book.authorId === parent.id);
  }
}
