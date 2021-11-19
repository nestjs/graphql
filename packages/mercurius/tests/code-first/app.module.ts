import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../lib';
import { MercuriusDriver } from '../../lib/drivers';
import { DirectionsModule } from './directions/directions.module';
import { RecipesModule } from './recipes/recipes.module';

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
