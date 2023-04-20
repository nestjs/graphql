import { ResolveField, Resolver, Query, Parent } from '@nestjs/graphql';
import { AuthorDocument, getAllAuthors, getAllBooks } from '../datasource/data';
import { AuthorRecord, BookRecord } from './private.models';

@Resolver((of) => AuthorRecord)
export class AuthorResolver {
  @Query((returns) => [AuthorRecord], { name: 'authors' })
  getAuthors() {
    return getAllAuthors();
  }

  @ResolveField((returns) => [BookRecord], { name: 'books' })
  getBooksByAuthor(@Parent() parent: AuthorDocument) {
    return getAllBooks().filter((book) => book.authorId === parent.id);
  }
}
