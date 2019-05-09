import { Module } from '@nestjs/common';
import { join } from 'path';
import { GraphQLModule } from '../../lib';
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [
    RecipesModule,
    GraphQLModule.forRoot({
      debug: false,
      installSubscriptionHandlers: true,
      autoSchemaFile: join(
        process.cwd(),
        'integration/type-graphql/schema.gql',
      ),
    }),
  ],
})
export class ApplicationModule {}
