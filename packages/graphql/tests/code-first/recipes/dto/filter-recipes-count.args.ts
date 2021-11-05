import { ArgsType, Field } from '../../../../lib';

@ArgsType()
export class FilterRecipesCountArgs {
  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  status?: string;
}
