import { ObjectType } from '../../../../../../lib/decorators';

/**
 * Ingredient model definition
 */
@ObjectType()
export class Ingredient {
  id: string;

  name: string;
}
