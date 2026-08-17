import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { UnauthorizedFilter } from '../common/filters/unauthorized.filter.js';
import { DateScalar } from '../common/scalars/date.scalar.js';
import { IRecipesResolver } from './irecipes.resolver.js';
import { RecipesResolver } from './recipes.resolver.js';
import { RecipesService } from './recipes.service.js';

@Module({
  providers: [
    RecipesResolver,
    IRecipesResolver,
    RecipesService,
    DateScalar,
    {
      provide: APP_FILTER,
      useClass: UnauthorizedFilter,
    },
  ],
})
export class RecipesModule {}
