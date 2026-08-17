import { Module } from '@nestjs/common';
import { IRecipeResolver } from './irecipe.resolver.js';

@Module({
  providers: [IRecipeResolver],
})
export class RecipeModule {}
