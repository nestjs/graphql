import { Module } from '@nestjs/common';
import { GraphQLModule } from '../../lib';
import { RecipesModule } from '../code-first/recipes/recipes.module';
import { DirectionsModule } from '../code-first/directions/directions.module';
import { GraphQLSchema, lexicographicSortSchema } from 'graphql';

@Module({
  imports: [
    RecipesModule,
    DirectionsModule,
    GraphQLModule.forRoot({
      autoSchemaFile: 'schema.graphql',
      transformSchema: (schema: GraphQLSchema) =>
        lexicographicSortSchema(schema),
      transformAutoSchemaFile: true,
    }),
  ],
})
export class TransformAutoSchemaFileModule {}
