import { Field, ID, InterfaceType } from '@nestjs/graphql';

@InterfaceType()
export abstract class Character {
  @Field((type) => ID)
  id: string;

  @Field()
  name: string;
}
