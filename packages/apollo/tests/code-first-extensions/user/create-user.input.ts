import { Extensions, Field, InputType } from '@nestjs/graphql';

@InputType()
@Extensions({ exampleExtension: 'exampleValue' })
export class CreateUserInput {
  @Extensions({ fieldLevelExtension: 123 })
  @Field()
  name!: string;
}
