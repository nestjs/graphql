import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusFederationDriver } from '../../../lib';
import { RecipeModule } from './recipes/recipe.module';

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
