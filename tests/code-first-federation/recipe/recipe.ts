import {
  Directive,
  Field,
  ID,
  InterfaceType,
  ObjectType,
} from '../../../lib';

@InterfaceType()
export abstract class Base {
  @Field((type) => ID)
  id: string;
}

@InterfaceType({
  resolveType: (value) => {
    return Recipe;
  },
})
export abstract class IRecipe extends Base {
  @Field()
  title: string;

  @Field()
  @Directive('@external')
  externalField: string;
}

@ObjectType({ implements: IRecipe })
export class Recipe extends IRecipe {
  @Field()
  description: string;
}
