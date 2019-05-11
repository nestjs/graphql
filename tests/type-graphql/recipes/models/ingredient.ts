import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
export class Ingredient {
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  constructor(ingredient: Partial<Ingredient>) {
    Object.assign(this, ingredient);
  }
}
