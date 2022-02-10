<<<<<<< HEAD
import { Query, Resolver, Args } from '@nestjs/graphql';
=======
import { Args, Query, Resolver } from '@nestjs/graphql';
>>>>>>> 7624329 (chore(code-first): update imports to workspace paths)
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
