import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphQLSchema, lexicographicSortSchema } from 'graphql';
import { MercuriusDriver } from '../../lib/drivers/index.js';
import { DirectionsModule } from '../code-first/directions/directions.module.js';
import { RecipesModule } from '../code-first/recipes/recipes.module.js';

@Module({
  imports: [
    RecipesModule,
    DirectionsModule,
    GraphQLModule.forRoot({
      driver: MercuriusDriver,
      autoSchemaFile: 'schema.graphql',
      transformSchema: (schema: GraphQLSchema) =>
        lexicographicSortSchema(schema),
      transformAutoSchemaFile: true,
    }),
  ],
})
export class TransformAutoSchemaFileModule {}
