import { Field, ObjectType, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class AuthorRecord {
  @Field((type) => ID)
  id: string;

  @Field((type) => String)
  name: string;

  @Field((type) => [BookRecord])
  books: BookRecord[];

  @Field((type) => String)
  penName: string;

  @Field((type) => Boolean)
  contracted: boolean;

  @Field((type) => Int, { nullable: true })
  salary?: number;
}

@ObjectType()
export class BookRecord {
  @Field((type) => ID)
  id: string;

  @Field((type) => String)
  title: string;

  @Field(() => AuthorRecord)
  author: AuthorRecord;

  @Field(() => Int)
  unitsSold: number;
}
