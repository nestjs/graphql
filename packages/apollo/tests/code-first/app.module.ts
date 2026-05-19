import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '../../lib/index.js';
import { ApolloDriver } from '../../lib/drivers/index.js';
import { DirectionsModule } from './directions/directions.module.js';
import { RecipesModule } from './recipes/recipes.module.js';

@Module({
  imports: [
    RecipesModule,
    DirectionsModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      includeStacktraceInErrorResponses: false,
      installSubscriptionHandlers: true,
      autoSchemaFile: true,
    }),
  ],
})
export class ApplicationModule {}
