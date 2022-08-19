import { Field, ID, ObjectType } from '@nestjs/graphql';

class NodeIngredient {
  // This does not apply since the class is not decorated with the @ObjectType decorator
  @Field((type) => ID, {
    defaultValue: 'Not applied',
    description: 'Not applied',
    deprecationReason: 'Not applied',
  })
  id: string;
}

@ObjectType({ isAbstract: true })
class BaseIngredient extends NodeIngredient {
  @Field({
    defaultValue: 'default',
    deprecationReason: 'is deprecated',
    description: 'ingredient base name',
    nullable: true,
  })
  baseName: string;
}

@ObjectType()
export class Ingredient extends BaseIngredient {
  @Field({
    defaultValue: 'default',
    deprecationReason: 'is deprecated',
    description: 'ingredient name',
    nullable: true,
  })
  name: string;

  constructor(ingredient: Partial<Ingredient>) {
    super();
    Object.assign(this, ingredient);
  }
}
