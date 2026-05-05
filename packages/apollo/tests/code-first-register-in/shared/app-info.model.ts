import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AppInfo {
  @Field()
  version: string;
}
