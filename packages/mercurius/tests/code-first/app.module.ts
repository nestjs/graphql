import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../lib/index.js';
import { MercuriusDriver } from '../../lib/drivers/index.js';
import { DirectionsModule } from './directions/directions.module.js';
import { RecipesModule } from './recipes/recipes.module.js';

@Module({
  imports: [
    RecipesModule,
    DirectionsModule,
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      autoSchemaFile: true,
    }),
  ],
})
export class ApplicationModule {}
