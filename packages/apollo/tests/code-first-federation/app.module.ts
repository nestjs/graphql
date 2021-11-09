import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { ApolloServerPluginInlineTraceDisabled } from 'apollo-server-core';
import { ApolloDriverConfig } from '../../lib';
import { ApolloFederationDriver } from '../../lib/drivers';
import { PostModule } from './post/post.module';
import { RecipeModule } from './recipe/recipe.module';
import { User } from './user/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    UserModule,
    PostModule,
    RecipeModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloFederationDriver,
      debug: false,
      autoSchemaFile: true,
      buildSchemaOptions: {
        orphanedTypes: [User],
      },
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
})
export class ApplicationModule {}
