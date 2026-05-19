import { ObjectType } from '../../../../../../lib/decorators/index.js';

/**
 * Ingredient model definition
 */
@ObjectType()
export class Ingredient {
  id: string;

  name: string;
}
