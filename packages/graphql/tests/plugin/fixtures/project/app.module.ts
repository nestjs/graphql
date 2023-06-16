import { Module } from '@nestjs/common';
import { GraphQLModule } from '../../../../lib';
import { RecipesModule } from './recipes/recipes.module';

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
