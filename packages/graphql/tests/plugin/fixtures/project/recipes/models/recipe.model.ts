import { Field, ObjectType } from '../../../../../../lib/decorators';
import { Ingredient } from './ingredient.model';

@ObjectType({ description: 'recipe ' })
export class Recipe {
  id: string;

  /**
   * The title of the recipe
   * @example Recipe title
   */
  title: string;

  description?: string;

  /**
   * Creation date of the recipe
   */
  @Field((type) => Date)
  creationDate: Date;

  ingredients: Ingredient[];

  /**
   * Ingredients with field decorator
   */
  @Field((type) => [Ingredient])
  ingredientsWithFieldDecorator: Ingredient[];

  primary: Ingredient;
}
