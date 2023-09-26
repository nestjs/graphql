import { ResolveField, Resolver, Query, Parent } from '@nestjs/graphql';
import { BookDocument, getAllAuthors, getAllBooks } from '../datasource/data';
import { BookRecord, AuthorRecord } from './private.models';

@Resolver((of) => BookRecord)
export class BookResolver {
  @Query((returns) => [BookRecord], { name: 'books' })
  getBooks() {
    return getAllBooks();
  }

  @ResolveField((returns) => AuthorRecord, { name: 'author' })
  getAuthor(@Parent() parent: BookDocument) {
    return getAllAuthors().find((author) => author.id === parent.authorId);
  }
}
