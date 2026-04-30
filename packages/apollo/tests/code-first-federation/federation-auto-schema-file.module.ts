import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '../../lib';
import { ApolloFederationDriver } from '../../lib/drivers';
import { HumanModule } from './human/human.module';
import { PostModule } from './post/post.module';
import { RecipeModule } from './recipe/recipe.module';
import { User } from './user/user.entity';
import { UserModule } from './user/user.module';

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
