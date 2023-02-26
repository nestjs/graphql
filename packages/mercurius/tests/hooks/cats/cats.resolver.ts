import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class CatsResolver {
  @Query((returns) => String)
  public getAnimalName(): string {
    return 'cat';
  }
}
