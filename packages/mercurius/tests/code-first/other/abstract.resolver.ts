import { Args, Query, Resolver } from '@nestjs/graphql';
import { RecipesArgs } from '../recipes/dto/recipes.args.js';
import { Recipe } from '../recipes/models/recipe.js';

@Resolver(() => Recipe, { isAbstract: true })
export class AbstractResolver {
  @Query((returns) => [Recipe])
  abstractRecipes(@Args() recipesArgs: RecipesArgs): Recipe[] {
    return [];
  }
}
