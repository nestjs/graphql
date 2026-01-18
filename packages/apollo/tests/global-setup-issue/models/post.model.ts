import { Field, ID, ObjectType } from '@nestjs/graphql';
import { NestedContent } from './nested-content.model';

/**
 * Post ObjectType with a nested NestedContent field
 */
@ObjectType()
export class Post {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field(() => NestedContent)
  content: NestedContent;

  constructor(data?: Partial<Post>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}
