import { Query, Resolver, ResolveField } from '@nestjs/graphql';
import { Human } from './human.entity';
import { Character } from './character.entity';

@Resolver(() => Character)
export class HumanResolver {
  @Query(() => [Human])
  humans(): Human[] {
    return [
      { id: '1', name: 'Bob' },
      { id: '2', name: 'Alice' },
    ];
  }

  @ResolveField(() => [Human])
  friends(): Human[] {
    return [{ id: '3', name: 'Peter' }];
  }
}
