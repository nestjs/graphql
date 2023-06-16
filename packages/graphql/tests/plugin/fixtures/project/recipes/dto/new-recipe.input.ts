import { IsOptional, Length, MaxLength } from 'class-validator';
import { InputType } from '../../../../../../lib/decorators';

@InputType()
export class NewRecipeInput {
  /**
   * The title of the recipe
   */
  @MaxLength(30)
  title: string;

  @IsOptional()
  @Length(30, 255)
  description?: string;

  ingredients: string[];
}
