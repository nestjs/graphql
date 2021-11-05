import { Module } from '@nestjs/common';
import { GraphQLModule } from '../../lib';
import { RecipesModule } from '../code-first/recipes/recipes.module';
import { DirectionsModule } from '../code-first/directions/directions.module';

@Module({
  imports: [
    RecipesModule,
    DirectionsModule,
    GraphQLModule.forRoot({
      autoSchemaFile: 'schema.graphql',
      sortSchema: true,
    }),
  ],
})
export class SortAutoSchemaModule {}
