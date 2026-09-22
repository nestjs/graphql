import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Comment {
  @Field(() => ID)
  id: string;

  @Field()
  text: string;

  postId: string;
}
