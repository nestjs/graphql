import { Max, Min } from 'class-validator';
import { ArgsType, Field, Int } from '../../../../lib';

@ArgsType()
export class RecipesArgs {
  @Field(type => Int, { description: 'number of items to skip' })
  @Min(0)
  skip: number = 0;

  @Field(type => Int)
  @Min(1)
  @Max(50)
  take: number = 25;
}
