import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '../../lib/drivers';
import { DirectionsModule } from '../code-first/directions/directions.module';
import { RecipesModule } from '../code-first/recipes/recipes.module';

@Module({
  imports: [
    RecipesModule,
    DirectionsModule,
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.graphql',
      sortSchema: true,
      buildSchemaOptions: {
        addNewlineAtEnd: true,
      },
    }),
  ],
})
export class SortAutoSchemaModule {}
