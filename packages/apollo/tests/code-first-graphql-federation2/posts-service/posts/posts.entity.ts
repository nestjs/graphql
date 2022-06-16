import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';
import { PostType } from './post-type.enum';

@ObjectType()
@Directive('@key(fields: "id")')
export class Post {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  body: string;

  userId: string;

  @Field({ nullable: true })
  publishDate: Date;

  @Field(() => PostType, { nullable: true })
  type: PostType;
}
