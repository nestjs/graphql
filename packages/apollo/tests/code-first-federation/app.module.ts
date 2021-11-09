import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { ApolloServerPluginInlineTraceDisabled } from 'apollo-server-core';
import { ApolloAdapterOptions } from '../../lib';
import { ApolloFederationGraphQLAdapter } from '../../lib/adapters';
import { PostModule } from './post/post.module';
import { RecipeModule } from './recipe/recipe.module';
import { User } from './user/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    UserModule,
    PostModule,
    RecipeModule,
    GraphQLModule.forRoot<ApolloAdapterOptions>({
      adapter: ApolloFederationGraphQLAdapter,
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
