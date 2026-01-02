import { Extensions, Field, ID, ObjectType } from '@nestjs/graphql';
import { Status } from './user-status.dto';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Extensions({ isPublic: true })
  @Field(() => Status, { nullable: true, description: 'DTO Description' })
  status?: Status;
}
