import { ResolveField, Resolver, Query, Parent } from '@nestjs/graphql';
import { BookDocument, getAllAuthors, getAllBooks } from '../datasource/data';
import { Book, Author } from './public.models';

@Resolver((of) => Book)
export class BookResolver {
  @Query((returns) => [Book], { name: 'books' })
  getBooks() {
    return getAllBooks();
  }

  @ResolveField((returns) => Author, { name: 'author' })
  getAuthor(@Parent() parent: BookDocument) {
    return getAllAuthors().find((author) => author.id === parent.authorId);
  }
}
