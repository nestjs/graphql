import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusFederationDriver } from '../../../lib/index.js';
import { RecipeModule } from './recipes/recipe.module.js';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      autoSchemaFile: true,
    }),
    RecipeModule,
  ],
})
export class AppModule {}
