import { Query, Resolver, Args } from '@nestjs/graphql';
import { CatType } from '../enums/cat-type.enum';

@Resolver()
export class CatsResolver {
  @Query((returns) => String)
  getAnimalName(): string {
    return 'cat';
  }

  @Resolver()
  @Query((returns) => CatType)
  catType(
    @Args({ name: 'catType', type: () => CatType })
    catType: CatType,
  ): CatType {
    return catType;
  }
}
