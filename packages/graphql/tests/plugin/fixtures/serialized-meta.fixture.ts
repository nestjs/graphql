// @ts-nocheck
export default async () => {
  const t = {
    ['./recipes/models/ingredient.model']: await import(
      './recipes/models/ingredient.model'
    )
  };
  return {
    '@nestjs/graphql': {
      models: [
        [
          import('./recipes/dto/new-recipe.input.js'),
          {
            NewRecipeInput: {
              title: {
                type: () => String,
                description: 'The title of the recipe'
              },
              description: { nullable: true, type: () => String },
              ingredients: { type: () => [String] }
            }
          }
        ],
        [
          import('./recipes/dto/recipes.args.js'),
          {
            RecipesArgs: {
              skip: { type: () => Number },
              take: { type: () => Number }
            }
          }
        ],
        [
          import('./recipes/models/ingredient.model.js'),
          {
            Ingredient: {
              id: { type: () => String },
              name: { type: () => String }
            }
          }
        ],
        [
          import('./recipes/models/recipe.model.js'),
          {
            Recipe: {
              id: { type: () => String },
              title: {
                type: () => String,
                description: 'The title of the recipe'
              },
              description: { nullable: true, type: () => String },
              ingredients: {
                type: () => [t['./recipes/models/ingredient.model'].Ingredient]
              },
              primary: {
                type: () => t['./recipes/models/ingredient.model'].Ingredient
              },
              creationDate: { description: 'Creation date of the recipe' },
              ingredientsWithFieldDecorator: {
                description: 'Ingredients with field decorator'
              }
            }
          }
        ]
      ]
    }
  };
};
