import { Query, Resolver } from '../../../lib';
import { IRecipe } from './recipe';

@Resolver((of) => IRecipe)
export class IRecipeResolver {
  @Query((returns) => IRecipe)
  public recipe() {
    return { id: '1', title: 'Recipe', description: 'Interface description' };
  }
}
