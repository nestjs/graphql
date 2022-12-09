import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class DogsResolver {
  @Query((returns) => String)
  getAnimalName(): string {
    return 'dog';
  }
}
