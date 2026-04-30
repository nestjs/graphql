import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AppInfo } from '../shared/app-info.model';
import { UsersModule } from './users.module';

@ObjectType({ registerIn: () => UsersModule })
export class User {
  @Field((type) => ID)
  id: string;

  @Field()
  name: string;

  @Field((type) => AppInfo)
  info: AppInfo;
}
