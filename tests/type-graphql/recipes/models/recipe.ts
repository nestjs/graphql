import { Field, ID, InterfaceType, ObjectType } from 'type-graphql';

@InterfaceType({
  resolveType: value => {
    return Recipe;
  },
})
export abstract class IRecipe {
  @Field(type => ID)
  id: string;

  @Field()
  title: string;
}

@ObjectType({ implements: IRecipe })
export class Recipe {
  @Field(type => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  creationDate: Date;

  @Field()
  get averageRating(): number {
    return 0.5;
  }

  constructor(recipe: Partial<Recipe>) {
    Object.assign(this, recipe);
  }
}
