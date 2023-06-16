import { ObjectType } from '../../../../../../lib/decorators';
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

  creationDate: Date;

  ingredients: Ingredient[];

  primary: Ingredient;
}
