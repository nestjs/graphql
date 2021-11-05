import { ArgsType, Field } from '@nestjs/graphql-experimental';
@ArgsType()
export class FilterRecipesCountArgs {
  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  status?: string;
}
