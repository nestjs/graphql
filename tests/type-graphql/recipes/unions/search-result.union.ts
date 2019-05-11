import { createUnionType } from 'type-graphql';
import { Ingredient } from '../models/ingredient';
import { Recipe } from '../models/recipe';

export const SearchResultUnion = createUnionType({
  name: 'SearchResultUnion',
  types: [Ingredient, Recipe],
  resolveType: value => {
    if ('name' in value) {
      return Ingredient;
    }
    if ('title' in value) {
      return Recipe;
    }
    return undefined;
  },
});
