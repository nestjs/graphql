import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '../../lib/index.js';
import { ApolloFederationDriver } from '../../lib/drivers/index.js';
import { HumanModule } from './human/human.module.js';
import { PostModule } from './post/post.module.js';
import { RecipeModule } from './recipe/recipe.module.js';
import { User } from './user/user.entity.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [
    UserModule,
    PostModule,
    RecipeModule,
    HumanModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      inheritResolversFromInterfaces: true,
      driver: ApolloFederationDriver,
      includeStacktraceInErrorResponses: false,
      autoSchemaFile: 'federation-schema.graphql',
      buildSchemaOptions: {
        orphanedTypes: [User],
      },
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
})
export class FederationAutoSchemaFileModule {}
