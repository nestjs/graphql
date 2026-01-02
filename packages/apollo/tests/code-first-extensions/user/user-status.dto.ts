import { ID, Field, ObjectType, Extensions } from '@nestjs/graphql';

@ObjectType()
export class Status {
  @Field(() => ID)
  id!: string;

  @Field()
  @Extensions({ isPublic: true })
  code!: string;
}
