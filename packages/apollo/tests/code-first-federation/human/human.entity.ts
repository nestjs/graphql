import { ObjectType } from '@nestjs/graphql';
import { Character } from './character.entity.js';

@ObjectType({
  implements: () => [Character],
})
export class Human implements Character {
  id: string;
  name: string;
}
