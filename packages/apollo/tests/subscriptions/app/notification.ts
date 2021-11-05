import { Field, ObjectType } from '@nestjs/graphql-experimental';

@ObjectType()
export class Notification {
  @Field({
    nullable: false,
  })
  id: string;

  @Field({
    nullable: false,
  })
  recipient: string;

  @Field({
    nullable: false,
  })
  message: string;
}
