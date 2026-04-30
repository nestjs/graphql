import { Field, InputType } from '@nestjs/graphql';
import { UsersModule } from './users.module';

@InputType({ registerIn: () => UsersModule })
export class CreateUserInput {
  @Field()
  name: string;
}
