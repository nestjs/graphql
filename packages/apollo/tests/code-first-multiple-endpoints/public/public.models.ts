import { Field, ObjectType, ID } from '@nestjs/graphql';
import { forwardRef } from '@nestjs/common';

@ObjectType()
export class Author {
  @Field((type) => ID)
  id: string;

  @Field((type) => String)
  name: string;

  @Field((type) => [Book])
  books: Book[];
}

@ObjectType()
export class Book {
  @Field((type) => ID)
  id: string;

  @Field((type) => String)
  title: string;

  @Field(() => Author)
  author: Author;
}
