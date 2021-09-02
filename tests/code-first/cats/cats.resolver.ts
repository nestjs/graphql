import { Query, Resolver } from '../../../lib';

@Resolver()
export class CatsResolver {
  @Query(returns => String)
  getAnimalName(): string {
    return 'cat';
  }
}
