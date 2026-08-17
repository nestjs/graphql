import { Module } from '@nestjs/common';
import { GraphQLModule } from '../../../../lib/index.js';
import { RecipesModule } from './recipes/recipes.module.js';

@Module({
  imports: [
    RecipesModule,
    GraphQLModule.forRoot({
      driver: null,
      autoSchemaFile: 'schema.gql',
    }),
  ],
})
export class AppModule {}
