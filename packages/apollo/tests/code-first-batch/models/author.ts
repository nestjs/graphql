import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Author {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}
