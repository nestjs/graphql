import { Field, ID, InterfaceType, ObjectType } from '../../../../lib';
import { METADATA_FACTORY_NAME } from '../../../../lib/plugin/plugin-constants';

@InterfaceType({
  description: 'example interface',
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

@ObjectType({ implements: IRecipe, description: 'recipe object type' })
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

  static [METADATA_FACTORY_NAME]() {
    return {
      lastRate: { nullable: true, type: () => Number },
      tags: { nullable: false, type: () => [String] },
    };
  }
}
