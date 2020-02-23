import { Field, ID, ObjectType, Directive, Int } from 'type-graphql';

@ObjectType()
@Directive('@key(fields: "id")')
export class Post {
  @Field(type => ID)
  public id: number;

  @Field()
  public title: string;

  @Field(type => Int)
  public authorId: number;

  constructor(post: Partial<Post>) {
    Object.assign(this, post);
  }
}
