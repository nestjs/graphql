import { ObjectType } from '@nestjs/graphql';
import { Character } from './character.entity';

@ObjectType({
  implements: () => [Character],
})
export class Human implements Character {
  id: string;
  name: string;
}
