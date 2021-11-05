import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { GraphQLSchema, lexicographicSortSchema } from 'graphql';
import { ApolloGraphQLAdapter } from '../../lib/adapters';
import { DirectionsModule } from '../code-first/directions/directions.module';
import { RecipesModule } from '../code-first/recipes/recipes.module';

@Module({
  imports: [
    RecipesModule,
    DirectionsModule,
    GraphQLModule.forRoot({
      adapter: ApolloGraphQLAdapter,
      autoSchemaFile: 'schema.graphql',
      transformSchema: (schema: GraphQLSchema) =>
        lexicographicSortSchema(schema),
      transformAutoSchemaFile: true,
    }),
  ],
})
export class TransformAutoSchemaFileModule {}
