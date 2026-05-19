import { Max, Min } from 'class-validator';
import { ArgsType } from '../../../../../../lib/decorators/index.js';

@ArgsType()
export class RecipesArgs {
  @Min(0)
  skip: number = 0;

  @Min(1)
  @Max(50)
  take: number = 25;
}
