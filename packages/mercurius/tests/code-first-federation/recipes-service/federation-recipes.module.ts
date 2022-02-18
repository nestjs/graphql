import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriverConfig, MercuriusFederationDriver } from '../../../lib';
import { RecipeModule } from './recipes/recipe.module';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusFederationDriver,
      autoSchemaFile: true,
      federationMetadata: true,
    }),
    RecipeModule,
  ],
})
export class AppModule {}
